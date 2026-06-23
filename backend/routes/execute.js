const router = require('express').Router();

const { runCode } = require('../controllers/executionController');

// REMOVE 'protect' middleware for debugging
router.post('/', runCode);

module.exports = router;
