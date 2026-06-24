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
  const lang = (language || '').toLowerCase().trim();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect loops
    if (/\b(for|while)\b/.test(line)) {
      loops.push({
        type: line.includes('while') ? 'while' : 'for',
        line: lineNum
      });
    }

    // Detect functions and variables
    if (lang === 'python') {
      const fnMatch = line.match(/^\s*def\s+(\w+)\s*\(/);
      if (fnMatch) functions.push(fnMatch[1]);
      
      const varMatch = line.match(/^\s*(\w+)\s*=/);
      if (varMatch && varMatch[1].length > 1 && !/^[A-Z0-9_]+$/.test(varMatch[1])) {
        variables.add(varMatch[1]);
      }
    } else if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
      const fnMatch = line.match(/\b(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/);
      if (fnMatch) functions.push(fnMatch[1] || fnMatch[2]);

      const varMatch = line.match(/\b(?:let|const|var)\s+(\w+)\b/);
      if (varMatch) variables.add(varMatch[1]);
    } else if (lang === 'java') {
      const fnMatch = line.match(/(?:public|private|protected|static)\s+\w[\w<>\[\]]*\s+(\w+)\s*\(/);
      if (fnMatch) functions.push(fnMatch[1]);

      const varMatch = line.match(/\b(?:int|String|boolean|double|float|long|List|Map|Set)\s+(\w+)\b/);
      if (varMatch) variables.add(varMatch[1]);
    } else if (['cpp', 'c++', 'c'].includes(lang)) {
      const fnMatch = line.match(/\w[\w\s:*&]*\s+(\w+)\s*\([^)]*\)\s*(?:const\s*)?\{/);
      if (fnMatch) functions.push(fnMatch[1]);

      const varMatch = line.match(/\b(?:int|double|float|char|string|auto|vector|map|set)\s+(\w+)\b/);
      if (varMatch) variables.add(varMatch[1]);
    }
  }

  return {
    functions: functions.filter(f => !['main', 'anonymous'].includes(f)),
    variables: Array.from(variables).filter(v => v.length > 1),
    loops
  };
};

const generateLocalFallbackQuestions = (code, language) => {
  const parsed = parseCodeLocal(code, language);
  const questions = [];
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 1. Function question
  if (parsed.functions.length > 0) {
    const fn = pickRandom(parsed.functions);
    questions.push({
      questionText: `In your implementation, explain the design choice behind the '${fn}' function. How does it handle edge cases like null or empty inputs?`,
      contextCodeSnippet: `function ${fn}`
    });
  }

  // 2. Loop question
  if (parsed.loops.length > 0) {
    const loop = pickRandom(parsed.loops);
    questions.push({
      questionText: `On line ${loop.line}, you used a '${loop.type}' loop. What is the precise termination condition of this loop, and how could it be optimized?`,
      contextCodeSnippet: `line ${loop.line}`
    });
  }

  // 3. Variable question
  if (questions.length < 2 && parsed.variables.length > 0) {
    const varName = pickRandom(parsed.variables);
    questions.push({
      questionText: `You defined the variable '${varName}'. How is its value mutated, and does it represent an invariant state during execution?`,
      contextCodeSnippet: `variable ${varName}`
    });
  }

  // 4. Default fallbacks if code is extremely short
  while (questions.length < 2) {
    if (questions.length === 0) {
      questions.push({
        questionText: `Looking at your code design, explain why you chose this specific approach over other potential design patterns or algorithms?`,
        contextCodeSnippet: `General implementation approach`
      });
    } else {
      questions.push({
        questionText: `If the size of the input elements scales to 1,000,000, how would your code perform in terms of time and space constraints?`,
        contextCodeSnippet: `Time/Space Scaling`
      });
    }
  }

  return questions.slice(0, 2);
};

const generateConceptualQuestions = async (questionDescription, code, language) => {
  try {
    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/generate-questions`,
      {
        question_description: questionDescription,
        code,
        language,
      },
      { timeout: 10000 }
    );
    return response.data.questions || [];
  } catch (error) {
    console.warn('⚠️  ML Service offline/error. Running local code AST parser fallback to generate dynamic questions...');
    return generateLocalFallbackQuestions(code, language);
  }
};

module.exports = { predictAuthenticity, generateConceptualQuestions };

