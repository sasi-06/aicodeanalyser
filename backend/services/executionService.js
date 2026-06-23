

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuid } = require('uuid');

const executeCode = async (code, language, stdin = '') => {
  // Supported: java, python, c, cpp
  const id = uuid();
  const dir = path.join(os.tmpdir(), id);
  fs.mkdirSync(dir);

  let filePath, compile, run;
  let output = '';
  let error = '';
  let compile_output = '';
  let status = 'Accepted';
  let statusId = 3;
  let success = true;
  let startTime = Date.now();

  function cleanup() {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }

  function makeResult() {
    return {
      stdout: output,
      stderr: error,
      compile_output,
      status,
      statusId,
      time: ((Date.now() - startTime) / 1000).toFixed(2),
      memory: 0,
      success,
    };
  }

  const TIMEOUT = 10000; // 10 seconds timeout

  try {
    if (language === 'java') {
      filePath = path.join(dir, 'Main.java');
      fs.writeFileSync(filePath, code);
      compile = spawn('javac', [filePath]);
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          compile.kill();
          status = 'Compilation Timeout';
          resolve();
        }, TIMEOUT);

        compile.stderr.on('data', (d) => { compile_output += d.toString(); });
        compile.on('close', (c) => {
          clearTimeout(timer);
          if (c !== 0) {
            status = status === 'Compilation Timeout' ? status : 'Compilation Error';
            statusId = 6;
            success = false;
            cleanup();
            resolve();
          } else {
            run = spawn('java', ['-cp', dir, 'Main']);
            runCodeProcess(run, stdin, resolve);
          }
        });
      });
    } else if (language === 'python') {
      filePath = path.join(dir, 'main.py');
      fs.writeFileSync(filePath, code);
      run = spawn('python', [filePath]);
      await new Promise((resolve) => runCodeProcess(run, stdin, resolve));
    } else if (language === 'c') {
      filePath = path.join(dir, 'main.c');
      const exePath = path.join(dir, 'out.exe');
      fs.writeFileSync(filePath, code);
      compile = spawn('gcc', [filePath, '-o', exePath]);
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          compile.kill();
          status = 'Compilation Timeout';
          resolve();
        }, TIMEOUT);

        compile.stderr.on('data', (d) => { compile_output += d.toString(); });
        compile.on('close', (c) => {
          clearTimeout(timer);
          if (c !== 0) {
            status = status === 'Compilation Timeout' ? status : 'Compilation Error';
            statusId = 6;
            success = false;
            cleanup();
            resolve();
          } else {
            run = spawn(exePath);
            runCodeProcess(run, stdin, resolve);
          }
        });
      });
    } else if (language === 'cpp') {
      filePath = path.join(dir, 'main.cpp');
      const exePath = path.join(dir, 'out.exe');
      fs.writeFileSync(filePath, code);
      compile = spawn('g++', [filePath, '-o', exePath]);
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          compile.kill();
          status = 'Compilation Timeout';
          resolve();
        }, TIMEOUT);

        compile.stderr.on('data', (d) => { compile_output += d.toString(); });
        compile.on('close', (c) => {
          clearTimeout(timer);
          if (c !== 0) {
            status = status === 'Compilation Timeout' ? status : 'Compilation Error';
            statusId = 6;
            success = false;
            cleanup();
            resolve();
          } else {
            run = spawn(exePath);
            runCodeProcess(run, stdin, resolve);
          }
        });
      });
    } else {
      status = 'Unsupported Language';
      statusId = 99;
      success = false;
      error = `Unsupported language: ${language}`;
      cleanup();
    }
  } catch (err) {
    status = 'Execution Error';
    statusId = 99;
    success = false;
    error = err.message;
    cleanup();
  }
  return makeResult();

  function runCodeProcess(proc, input, done) {
    const timer = setTimeout(() => {
      proc.kill();
      status = 'Time Limit Exceeded';
      statusId = 5;
      success = false;
    }, TIMEOUT);

    // Always ensure input ends with a newline (important for Java/C/C++)
    let finalInput = input || '';
    if (finalInput.length > 0 && !finalInput.endsWith('\n')) {
      finalInput += '\n';
    }
    
    if (finalInput.length > 0) {
      try {
        proc.stdin.write(finalInput, () => {
          proc.stdin.end();
        });
      } catch (e) {
        error += "\nStdin Write Error: " + e.message;
      }
    } else {
      proc.stdin.end();
    }

    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { error += d.toString(); });
    
    proc.on('error', (err) => {
      error += "\nProcess Error: " + err.message;
      success = false;
      status = 'Execution Error';
    });

    proc.on('close', () => {
      clearTimeout(timer);
      cleanup();
      done();
    });
  }
};

/**
 * Run code against an array of test cases
 * Supports both public and private (hidden) test cases
 */
const runTestCases = async (code, language, testCases) => {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    const result = await executeCode(code, language, tc.input);

    // If execution service is down, mark test as error — NOT as failed
    if (result.serviceUnavailable) {
      results.push({
        input: tc.input,
        expected: (tc.expectedOutput || '').trim(),
        actual: '',
        passed: false,
        hidden: tc.isHidden,
        error: true,
        errorMessage: 'Execution service unavailable',
      });
      continue;
    }

    const output = (result.stdout || '').trim();
    const expected = (tc.expectedOutput || '').trim();
    const isCorrect = result.success && output === expected;

    if (isCorrect) passed++;

    results.push({
      input: tc.input,
      expected,
      actual: output,
      passed: isCorrect,
      hidden: tc.isHidden,
      error: !result.success,
      errorMessage: !result.success
        ? (result.stderr || result.compile_output || result.status)
        : null,
      executionTime: result.time,
      memory: result.memory,
    });
  }

  return { results, passed, total: testCases.length };
};

module.exports = { executeCode, runTestCases };
