const axios = require('axios');
const { computeFallbackScore } = require('../utils/featureExtractor');

const predictAuthenticity = async (features) => {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      features,
      { timeout: 8000 }
    );
    return response.data;
  } catch (error) {
    console.warn('⚠️  ML service unavailable, using fallback scoring...');
    return computeFallbackScore(features);
  }
};

const parseCodeLocal = (code, language) => {
  const lines = (code || '').split('\n');
  const functions = [];
  const variables = new Set();
  const loops = [];
  const conditions = [];
  const dataStructures = [];
  const returns = [];
  const recursiveCalls = new Set();
  const errorHandling = [];
  const lang = (language || '').toLowerCase().trim();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Detect loops
    if (/\b(for|while)\b/.test(line)) {
      loops.push({ type: line.includes('while') ? 'while' : 'for', line: lineNum, content: trimmed.slice(0, 60) });
    }

    // Detect conditionals
    if (/\b(if|elif|else if|switch)\b/.test(line)) {
      conditions.push({ line: lineNum, content: trimmed.slice(0, 60) });
    }

    // Detect data structures
    if (/(\[\]|{|}|\bdict\b|\bmap\b|\bHashMap\b|\bSet\b|\bList\b|\bStack\b|\bQueue\b|\bvector\b|\barray\b)/.test(line)) {
      dataStructures.push({ line: lineNum, content: trimmed.slice(0, 60) });
    }

    // Detect return statements
    if (/\breturn\b/.test(line)) {
      returns.push({ line: lineNum, content: trimmed.slice(0, 60) });
    }

    // Detect error handling
    if (/\b(try|catch|except|finally|raise|throw)\b/.test(line)) {
      errorHandling.push({ line: lineNum, content: trimmed.slice(0, 60) });
    }

    if (lang === 'python') {
      const fnMatch = line.match(/^\s*def\s+(\w+)\s*\(/);
      if (fnMatch) {
        functions.push({ name: fnMatch[1], line: lineNum });
        // Detect recursion
        if (lines.slice(i + 1).some(l => l.includes(fnMatch[1] + '('))) {
          recursiveCalls.add(fnMatch[1]);
        }
      }
      const varMatch = line.match(/^\s*(\w+)\s*=/);
      if (varMatch && varMatch[1].length > 1 && !/^[A-Z0-9_]+$/.test(varMatch[1]) && varMatch[1] !== 'self') {
        variables.add({ name: varMatch[1], line: lineNum });
      }
    } else if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
      const fnMatch = line.match(/\b(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/);
      if (fnMatch) {
        const name = fnMatch[1] || fnMatch[2];
        if (name) {
          functions.push({ name, line: lineNum });
          if (lines.slice(i + 1).some(l => l.includes(name + '('))) recursiveCalls.add(name);
        }
      }
      const varMatch = line.match(/\b(?:let|const|var)\s+(\w+)\b/);
      if (varMatch) variables.add({ name: varMatch[1], line: lineNum });
    } else if (lang === 'java') {
      const fnMatch = line.match(/(?:public|private|protected|static)\s+\w[\w<>\[\]]*\s+(\w+)\s*\(/);
      if (fnMatch && fnMatch[1] !== 'main') {
        functions.push({ name: fnMatch[1], line: lineNum });
        if (lines.slice(i + 1).some(l => l.includes(fnMatch[1] + '('))) recursiveCalls.add(fnMatch[1]);
      }
      const varMatch = line.match(/\b(?:int|String|boolean|double|float|long|List|Map|Set|HashMap)\s+(\w+)\b/);
      if (varMatch) variables.add({ name: varMatch[1], line: lineNum });
    } else if (['cpp', 'c++', 'c'].includes(lang)) {
      const fnMatch = line.match(/\w[\w\s:*&]*\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/);
      if (fnMatch && fnMatch[1] !== 'main') {
        functions.push({ name: fnMatch[1], line: lineNum });
        if (lines.slice(i + 1).some(l => l.includes(fnMatch[1] + '('))) recursiveCalls.add(fnMatch[1]);
      }
      const varMatch = line.match(/\b(?:int|double|float|char|string|auto|vector|map|set|unordered_map)\s+(\w+)\b/);
      if (varMatch) variables.add({ name: varMatch[1], line: lineNum });
    }
  }

  return {
    functions,
    variables: Array.from(variables).filter(v => v.name.length > 1),
    loops,
    conditions,
    dataStructures,
    returns,
    recursiveCalls: Array.from(recursiveCalls),
    errorHandling,
    totalLines: lines.length,
    codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//') && !l.trim().startsWith('#')).length,
  };
};

const generateLocalFallbackQuestions = (code, language, usedQuestions = new Set()) => {
  const parsed = parseCodeLocal(code, language);
  const { functions, variables, loops, conditions, dataStructures, returns, recursiveCalls, errorHandling, totalLines } = parsed;
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Build a pool of ALL possible questions based on what's in THIS candidate's code
  const questionPool = [];

  // ── Function-specific questions ──────────────────────────────────────────────
  if (functions.length > 0) {
    const fn = pickRandom(functions);
    questionPool.push({
      questionText: `Your function \`${fn.name}\` is defined on line ${fn.line}. Walk me through exactly what it does step by step, and explain how it handles edge cases like empty inputs or null values.`,
      contextCodeSnippet: `function: ${fn.name} (line ${fn.line})`
    });
    questionPool.push({
      questionText: `What is the time complexity of your \`${fn.name}\` function (line ${fn.line})? Could you achieve the same result with better Big-O performance?`,
      contextCodeSnippet: `function: ${fn.name} (line ${fn.line})`
    });
    if (functions.length > 1) {
      const fn2 = functions.find(f => f.name !== fn.name) || fn;
      questionPool.push({
        questionText: `You wrote both \`${fn.name}\` and \`${fn2.name}\`. Explain why you separated them into two functions instead of combining them into one.`,
        contextCodeSnippet: `functions: ${fn.name}, ${fn2.name}`
      });
    }
  }

  // ── Recursion-specific questions ─────────────────────────────────────────────
  if (recursiveCalls.length > 0) {
    const recFn = recursiveCalls[0];
    questionPool.push({
      questionText: `Your \`${recFn}\` function appears to be recursive. What is the base case that stops the recursion, and what happens if the input never reaches that base case?`,
      contextCodeSnippet: `recursive function: ${recFn}`
    });
    questionPool.push({
      questionText: `Could your \`${recFn}\` recursive solution be rewritten iteratively? What are the trade-offs between the two approaches in terms of stack memory usage?`,
      contextCodeSnippet: `recursive function: ${recFn}`
    });
  }

  // ── Loop-specific questions ───────────────────────────────────────────────────
  if (loops.length > 0) {
    const loop = pickRandom(loops);
    questionPool.push({
      questionText: `On line ${loop.line} you used a \`${loop.type}\` loop: \`${loop.content}\`. Precisely what is the termination condition of this loop, and what happens if that condition is never met?`,
      contextCodeSnippet: `${loop.type} loop at line ${loop.line}`
    });
    if (loops.length > 1) {
      questionPool.push({
        questionText: `You have ${loops.length} loops in your solution. Do any of them run inside another loop? If yes, explain how that affects the overall time complexity of your solution.`,
        contextCodeSnippet: `${loops.length} loops detected`
      });
    }
  }

  // ── Variable-specific questions ───────────────────────────────────────────────
  if (variables.length > 0) {
    const v = pickRandom(Array.from(variables));
    questionPool.push({
      questionText: `You declared the variable \`${v.name}\` on line ${v.line}. Explain exactly what it stores, how its value changes throughout the execution, and why you chose that specific name for it.`,
      contextCodeSnippet: `variable: ${v.name} (line ${v.line})`
    });
  }

  // ── Data structure questions ──────────────────────────────────────────────────
  if (dataStructures.length > 0) {
    const ds = pickRandom(dataStructures);
    questionPool.push({
      questionText: `On line ${ds.line} you used a data structure: \`${ds.content}\`. Why did you choose this specific structure? What would break if you replaced it with a simple array?`,
      contextCodeSnippet: `data structure at line ${ds.line}`
    });
  }

  // ── Conditional questions ─────────────────────────────────────────────────────
  if (conditions.length > 0) {
    const cond = pickRandom(conditions);
    questionPool.push({
      questionText: `On line ${cond.line} you have the condition: \`${cond.content}\`. Walk me through every possible branch that can be taken from this point in the code and explain what scenario each branch handles.`,
      contextCodeSnippet: `condition at line ${cond.line}`
    });
  }

  // ── Return value questions ────────────────────────────────────────────────────
  if (returns.length > 0) {
    const ret = pickRandom(returns);
    questionPool.push({
      questionText: `On line ${ret.line} your code returns: \`${ret.content}\`. Under what conditions would the code reach this specific return statement versus a different one? What does this return value represent to the caller?`,
      contextCodeSnippet: `return at line ${ret.line}`
    });
  }

  // ── Error handling questions ──────────────────────────────────────────────────
  if (errorHandling.length > 0) {
    const err = pickRandom(errorHandling);
    questionPool.push({
      questionText: `You added error handling on line ${err.line}: \`${err.content}\`. What specific failure scenario does this guard against? What would happen to your program's output if this block was completely removed?`,
      contextCodeSnippet: `error handling at line ${err.line}`
    });
  }

  // ── Code size / approach questions ───────────────────────────────────────────
  questionPool.push({
    questionText: `Your solution is ${totalLines} lines long. Is there any part of this code you feel could be simplified or refactored without changing the final output? Walk me through which section and why.`,
    contextCodeSnippet: `Total lines: ${totalLines}`
  });

  questionPool.push({
    questionText: `Without looking at the problem statement, describe what your code does in plain English as if you were explaining it to someone with no programming knowledge. Start from the very first line.`,
    contextCodeSnippet: `Full code walkthrough`
  });

  questionPool.push({
    questionText: `What is the single most fragile or risky part of your solution — the part most likely to fail on an unexpected input? How would you make it more robust?`,
    contextCodeSnippet: `Code robustness analysis`
  });

  // Shuffle, then filter out any question already asked globally, then pick 2
  const shuffled = questionPool.sort(() => Math.random() - 0.5);
  const fresh = shuffled.filter(
    q => !usedQuestions.has(q.questionText.trim().toLowerCase())
  );

  // If we ran out of fresh questions (very unlikely), use the full pool as fallback
  const finalPool = fresh.length >= 2 ? fresh : shuffled;
  return finalPool.slice(0, 2);
};

const generateConceptualQuestions = async (questionDescription, code, language, usedQuestions = new Set()) => {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/generate-questions`,
      { question_description: questionDescription, code, language },
      { timeout: 10000 }
    );
    const questions = response.data.questions || [];
    // Filter out any questions already asked
    const fresh = questions.filter(
      q => !usedQuestions.has((q.questionText || '').trim().toLowerCase())
    );
    // If the ML service returned duplicates, fall back to local generator
    return fresh.length >= 2 ? fresh.slice(0, 2) : generateLocalFallbackQuestions(code, language, usedQuestions);
  } catch (error) {
    console.warn('⚠️  ML Service offline/error. Running local code AST parser fallback to generate dynamic questions...');
    return generateLocalFallbackQuestions(code, language, usedQuestions);
  }
};

module.exports = { predictAuthenticity, generateConceptualQuestions };

