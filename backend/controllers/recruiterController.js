const InterviewSession = require('../models/InterviewSession');
const MLPrediction     = require('../models/MLPrediction');
const Alert            = require('../models/Alert');
const TelemetryLog     = require('../models/TelemetryLog');
const User             = require('../models/User');
const Question         = require('../models/Question');
const Assessment       = require('../models/Assessment');
const Notification     = require('../models/Notification');
const TrainingData     = require('../models/TrainingData');
const axios            = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Numeric label map for ML training
const LABEL_MAP = { 'Genuine': 2, 'Review Needed': 1, 'Suspicious': 0 };

// GET /api/recruiter/dashboard
const getDashboard = async (req, res) => {
  try {
    const totalCandidates = await User.countDocuments({ role: 'candidate' });
    const totalSessions = await InterviewSession.countDocuments();
    const activeSessions = await InterviewSession.countDocuments({ status: 'in_progress' });
    const suspicious = await InterviewSession.countDocuments({ classification: 'Suspicious' });
    const genuine = await InterviewSession.countDocuments({ classification: 'Genuine' });
    const reviewNeeded = await InterviewSession.countDocuments({ classification: 'Review Needed' });
    const totalAlerts = await Alert.countDocuments();
    const totalAssessments = await Assessment.countDocuments({ recruiter: req.user._id });

    const recentSessions = await InterviewSession.find({ status: { $in: ['submitted', 'evaluated'] } })
      .populate('candidate', 'name email')
      .populate('question', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(10);

    const avgScore = await InterviewSession.aggregate([
      { $match: { authenticityScore: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$authenticityScore' } } },
    ]);

    res.json({
      stats: { totalCandidates, totalSessions, activeSessions, suspicious, genuine, reviewNeeded, totalAlerts, totalAssessments },
      avgAuthenticityScore: avgScore[0]?.avg?.toFixed(1) || 0,
      recentSessions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/sessions
const getAllSessions = async (req, res) => {
  try {
    const { status, classification, candidateId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (classification) filter.classification = classification;
    if (candidateId) filter.candidate = candidateId;
    const sessions = await InterviewSession.find(filter)
      .populate('candidate', 'name email')
      .populate('question', 'title difficulty')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await InterviewSession.countDocuments(filter);
    res.json({ sessions, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/alerts
const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate('candidate', 'name email')
      .populate('session', 'language status authenticityScore')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/candidates
const getCandidates = async (req, res) => {
  try {
    const candidates = await User.find({ role: 'candidate' }).select('-password');
    const result = await Promise.all(candidates.map(async (c) => {
      const sessions = await InterviewSession.find({ candidate: c._id });
      const avgScore = sessions.reduce((a, s) => a + (s.authenticityScore || 0), 0) / (sessions.length || 1);
      return { ...c.toObject(), sessionCount: sessions.length, avgScore: avgScore.toFixed(1) };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── QUESTION MANAGEMENT ───

// POST /api/recruiter/questions — create a new question
const createQuestion = async (req, res) => {
  try {
    const { title, description, difficulty, tags, examples, testCases, starterCode, timeLimit, memoryLimit, languagesSupported } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ message: 'At least one test case is required' });
    }

    const question = await Question.create({
      title,
      description,
      difficulty: difficulty || 'Medium',
      tags: tags || [],
      examples: examples || [],
      testCases,
      starterCode: starterCode || {},
      timeLimit: timeLimit || 30,
      memoryLimit: memoryLimit || 256,
      languagesSupported: languagesSupported || ['python', 'javascript', 'java', 'cpp'],
      createdBy: req.user._id,
    });

    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/questions — list all questions (optionally by this recruiter)
const getQuestions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.mine === 'true') filter.createdBy = req.user._id;
    const questions = await Question.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recruiter/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── ASSESSMENT MANAGEMENT ───

// POST /api/recruiter/assessments — create assessment & notify candidates
const createAssessment = async (req, res) => {
  try {
    const { title, candidateIds, questionIds, deadline, instructions } = req.body;

    if (!title || !candidateIds?.length || !questionIds?.length) {
      return res.status(400).json({ message: 'Title, at least one candidate, and at least one question are required' });
    }

    // Validate candidates exist
    const candidates = await User.find({ _id: { $in: candidateIds }, role: 'candidate' });
    if (candidates.length === 0) {
      return res.status(400).json({ message: 'No valid candidates found' });
    }

    // Validate questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length === 0) {
      return res.status(400).json({ message: 'No valid questions found' });
    }

    const assessment = await Assessment.create({
      title,
      recruiter: req.user._id,
      candidates: candidates.map(c => c._id),
      questions: questions.map(q => q._id),
      deadline: deadline || null,
      instructions: instructions || '',
    });

    // Create notifications for each candidate
    const notifications = [];
    for (const candidate of candidates) {
      const notification = await Notification.create({
        recipient: candidate._id,
        type: 'assessment_assigned',
        title: 'New Assessment Assigned',
        message: `You have been assigned "${title}" by ${req.user.name}. ${questions.length} question(s) to complete.`,
        data: {
          assessmentId: assessment._id,
          questionId: questions[0]._id,
        },
      });
      notifications.push(notification);

      // Emit socket notification to the candidate if they're online
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${candidate._id}`).emit('notification', {
          ...notification.toObject(),
          assessment: { _id: assessment._id, title },
        });
      }
    }

    const populated = await Assessment.findById(assessment._id)
      .populate('candidates', 'name email')
      .populate('questions', 'title difficulty')
      .populate('recruiter', 'name email');

    res.status(201).json({ assessment: populated, notificationsSent: notifications.length });
  } catch (err) {
    console.error('Assessment creation error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/assessments
const getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ recruiter: req.user._id })
      .populate('candidates', 'name email')
      .populate('questions', 'title difficulty')
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/assessments/:id
const getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('candidates', 'name email')
      .populate('questions', 'title difficulty tags testCases')
      .populate('recruiter', 'name email');
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/recruiter/assessments/:id - Update assessment
const updateAssessment = async (req, res) => {
  try {
    const { title, candidateIds, questionIds, deadline, instructions, status } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Verify recruiter owns this assessment
    if (assessment.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this assessment' });
    }
    
    if (title) assessment.title = title;
    if (deadline) assessment.deadline = deadline;
    if (instructions) assessment.instructions = instructions;
    if (status) assessment.status = status;
    
    // Update candidates if provided
    if (candidateIds && Array.isArray(candidateIds)) {
      const candidates = await User.find({ _id: { $in: candidateIds }, role: 'candidate' });
      if (candidates.length > 0) {
        assessment.candidates = candidates.map(c => c._id);
      }
    }
    
    // Update questions if provided
    if (questionIds && Array.isArray(questionIds)) {
      const questions = await Question.find({ _id: { $in: questionIds } });
      if (questions.length > 0) {
        assessment.questions = questions.map(q => q._id);
      }
    }
    
    assessment.updatedAt = new Date();
    await assessment.save();
    
    const populated = await Assessment.findById(assessment._id)
      .populate('candidates', 'name email')
      .populate('questions', 'title difficulty')
      .populate('recruiter', 'name email');
    
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/assessments/:id/questions - Add questions to assessment
const addQuestionsToAssessment = async (req, res) => {
  try {
    const { questionIds } = req.body;
    if (!questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'questionIds array is required' });
    }
    
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    if (assessment.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length === 0) {
      return res.status(400).json({ message: 'No valid questions found' });
    }
    
    // Add new questions that don't already exist
    const newQuestionIds = questions.map(q => q._id.toString());
    const existingIds = assessment.questions.map(id => id.toString());
    const uniqueIds = newQuestionIds.filter(id => !existingIds.includes(id));
    
    assessment.questions.push(...uniqueIds);
    assessment.updatedAt = new Date();
    await assessment.save();
    
    const populated = await Assessment.findById(assessment._id)
      .populate('candidate', 'name email')
      .populate('questions', 'title difficulty');
    
    res.json({ message: `${uniqueIds.length} question(s) added`, assessment: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/recruiter/assessments/:id/questions/:questionId - Remove question from assessment
const removeQuestionFromAssessment = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const assessment = await Assessment.findById(id);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    if (assessment.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    assessment.questions = assessment.questions.filter(qId => qId.toString() !== questionId);
    assessment.updatedAt = new Date();
    await assessment.save();
    
    const populated = await Assessment.findById(assessment._id)
      .populate('candidates', 'name email')
      .populate('questions', 'title difficulty');
    
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/recruiter/sessions/:id/review
// Also saves a TrainingData document for the self-learning ML loop
const updateSessionReview = async (req, res) => {
  try {
    const { classification, notes, status } = req.body;
    const session = await InterviewSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (classification) {
      session.classification = classification;
      session.humanLabel     = classification;   // ground-truth label for ML
    }
    if (notes)   session.recruiterNotes = notes;
    if (status)  session.status         = status;
    session.updatedAt = new Date();
    await session.save();

    // ── Save training data sample (self-learning loop) ─────────────────────
    if (classification) {
      try {
        const mlPrediction = await MLPrediction.findOne({ session: session._id });

        // Only create a new training sample if one doesn't already exist for this session
        const existing = await TrainingData.findOne({ session: session._id });
        if (!existing && mlPrediction) {
          const numericLabel = LABEL_MAP[classification] ?? 1;

          await TrainingData.create({
            session:   session._id,
            candidate: session.candidate,
            behavioralFeatures: {
              typing_speed:            mlPrediction.features?.typing_speed            || 0,
              average_pause_duration:  mlPrediction.features?.average_pause_duration  || 0,
              paste_ratio:             mlPrediction.features?.paste_ratio             || 0,
              edit_frequency:          mlPrediction.features?.edit_frequency          || 0,
              compile_attempts:        mlPrediction.features?.compile_attempts        || 0,
              error_frequency:         mlPrediction.features?.error_frequency         || 0,
              code_growth_rate:        mlPrediction.features?.code_growth_rate        || 0,
              idle_ratio:              mlPrediction.features?.idle_ratio              || 0,
              focus_loss_count:        mlPrediction.features?.focus_loss_count        || 0,
              off_screen_events_count: mlPrediction.features?.off_screen_events_count || 0,
              backspace_ratio:         mlPrediction.features?.backspace_ratio         || 0,
            },
            codeFeatures: mlPrediction.codeAnalysis || {},
            humanLabel:   classification,
            numericLabel,
            mlLabel:     mlPrediction.classification,
            mlScore:     mlPrediction.authenticityScore,
            wasCorrect:  mlPrediction.classification === classification,
            language:        session.language,
            testCasesPassed: session.testCasesPassed,
            totalTestCases:  session.totalTestCases,
            finalScore:      session.finalScore,
          });
          console.log(`📚 Training sample saved for session ${session._id} — label: ${classification}`);
        }
      } catch (tdErr) {
        console.warn('⚠️  Could not save training data sample:', tdErr.message);
      }
    }

    res.json({ message: 'Session review updated', session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/recruiter/model-stats
const getModelStats = async (req, res) => {
  try {
    const totalSamples  = await TrainingData.countDocuments();
    const genuineCount  = await TrainingData.countDocuments({ humanLabel: 'Genuine' });
    const suspiciousCount = await TrainingData.countDocuments({ humanLabel: 'Suspicious' });
    const reviewCount   = await TrainingData.countDocuments({ humanLabel: 'Review Needed' });
    const correctCount  = await TrainingData.countDocuments({ wasCorrect: true });
    const modelAccuracy = totalSamples > 0 ? ((correctCount / totalSamples) * 100).toFixed(1) : 0;

    // Fetch ML service stats
    let mlStats = null;
    try {
      const { data } = await axios.get(`${ML_URL}/model-stats`, { timeout: 5000 });
      mlStats = data;
    } catch (_) {
      mlStats = { model_loaded: false, model_type: 'Unknown', last_trained: null, accuracy: 0 };
    }

    res.json({
      trainingData: {
        total:       totalSamples,
        genuine:     genuineCount,
        suspicious:  suspiciousCount,
        reviewNeeded: reviewCount,
        modelAccuracyOnRealData: parseFloat(modelAccuracy),
      },
      mlService: mlStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/recruiter/retrain
// Sends all labeled TrainingData to the ML service for retraining
const retrainModel = async (req, res) => {
  try {
    const samples = await TrainingData.find().lean();

    if (samples.length === 0 && !req.body.forceWithSynthetic) {
      return res.status(400).json({
        message: 'No labeled training data yet. Review and confirm some sessions first, or pass forceWithSynthetic:true.',
      });
    }

    // Map to ML service schema
    const mlSamples = samples.map(s => ({
      typing_speed:            s.behavioralFeatures?.typing_speed            || 0,
      average_pause_duration:  s.behavioralFeatures?.average_pause_duration  || 0,
      paste_ratio:             s.behavioralFeatures?.paste_ratio             || 0,
      edit_frequency:          s.behavioralFeatures?.edit_frequency          || 0,
      compile_attempts:        s.behavioralFeatures?.compile_attempts        || 0,
      error_frequency:         s.behavioralFeatures?.error_frequency         || 0,
      code_growth_rate:        s.behavioralFeatures?.code_growth_rate        || 0,
      idle_ratio:              s.behavioralFeatures?.idle_ratio              || 0,
      focus_loss_count:        s.behavioralFeatures?.focus_loss_count        || 0,
      off_screen_events_count: s.behavioralFeatures?.off_screen_events_count || 0,
      backspace_ratio:         s.behavioralFeatures?.backspace_ratio         || 0,
      label:                   s.numericLabel ?? 1,
    }));

    const { data } = await axios.post(
      `${ML_URL}/retrain`,
      {
        samples:           mlSamples,
        include_synthetic: true,
        synthetic_boost:   req.body.syntheticBoost || 500,
      },
      { timeout: 120000 }   // up to 2 min for large retrains
    );

    console.log(`✅ Model retrained — ${data.real_samples} real + ${data.synthetic_samples} synthetic samples, accuracy: ${data.accuracy}%`);
    res.json(data);
  } catch (err) {
    console.error('Retrain error:', err.message);
    res.status(500).json({ message: err.response?.data?.detail || err.message });
  }
};

module.exports = {
  getDashboard, getAllSessions, getAlerts, getCandidates,
  createQuestion, getQuestions, deleteQuestion,
  createAssessment, getAssessments, getAssessmentById, updateAssessment, addQuestionsToAssessment, removeQuestionFromAssessment,
  updateSessionReview,
  getModelStats, retrainModel,
};
