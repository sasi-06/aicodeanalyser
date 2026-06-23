const router = require('express').Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getDashboard, getAllSessions, getAlerts, getCandidates,
  createQuestion, getQuestions, deleteQuestion,
  createAssessment, getAssessments, getAssessmentById, updateAssessment, addQuestionsToAssessment, removeQuestionFromAssessment,
  updateSessionReview,
} = require('../controllers/recruiterController');

// Dashboard
router.get('/dashboard', protect, requireRole('recruiter', 'admin'), getDashboard);
router.get('/sessions', protect, requireRole('recruiter', 'admin'), getAllSessions);
router.get('/alerts', protect, requireRole('recruiter', 'admin'), getAlerts);
router.get('/candidates', protect, requireRole('recruiter', 'admin'), getCandidates);
router.put('/sessions/:id/review', protect, requireRole('recruiter', 'admin'), updateSessionReview);

// Questions CRUD
router.get('/questions', protect, requireRole('recruiter', 'admin'), getQuestions);
router.post('/questions', protect, requireRole('recruiter', 'admin'), createQuestion);
router.delete('/questions/:id', protect, requireRole('recruiter', 'admin'), deleteQuestion);

// Assessments
router.get('/assessments', protect, requireRole('recruiter', 'admin'), getAssessments);
router.get('/assessments/:id', protect, requireRole('recruiter', 'admin'), getAssessmentById);
router.post('/assessments', protect, requireRole('recruiter', 'admin'), createAssessment);
router.put('/assessments/:id', protect, requireRole('recruiter', 'admin'), updateAssessment);
router.post('/assessments/:id/questions', protect, requireRole('recruiter', 'admin'), addQuestionsToAssessment);
router.delete('/assessments/:id/questions/:questionId', protect, requireRole('recruiter', 'admin'), removeQuestionFromAssessment);

module.exports = router;
