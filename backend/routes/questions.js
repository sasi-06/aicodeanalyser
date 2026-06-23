const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const { getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion } = require('../controllers/questionController');

router.get('/', protect, getQuestions);
router.get('/:id', protect, getQuestion);
router.post('/', protect, requireRole('recruiter', 'admin'), createQuestion);
router.put('/:id', protect, requireRole('recruiter', 'admin'), updateQuestion);
router.delete('/:id', protect, requireRole('recruiter', 'admin'), deleteQuestion);

module.exports = router;
