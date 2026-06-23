const { executeCode } = require('../services/executionService');

// POST /api/execute
const runCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;
    if (!code || !language) return res.status(400).json({ message: 'code and language are required' });
    const result = await executeCode(code, language, stdin || '');
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { runCode };
