const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { 
  startSession, submitSession, getMySessions, getSession, downloadReport,
  getMyAssessments, startSessionFromAssessment, generateQuestionsForSession
} = require('../controllers/sessionController');

router.post('/start', protect, startSession);
router.post('/start-from-assessment', protect, startSessionFromAssessment);
router.post('/:id/generate-conceptual', protect, generateQuestionsForSession);
router.post('/:id/submit', protect, submitSession);
router.get('/my', protect, getMySessions);
router.get('/assessments/my', protect, getMyAssessments);
router.get('/:id', protect, getSession);
router.get('/:id/report', protect, downloadReport);

module.exports = router;
