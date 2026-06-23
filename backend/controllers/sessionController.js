const InterviewSession = require('../models/InterviewSession');
const TelemetryLog = require('../models/TelemetryLog');
const MLPrediction = require('../models/MLPrediction');
const Alert = require('../models/Alert');
const Question = require('../models/Question');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const { extractFeatures, detectAlerts } = require('../utils/featureExtractor');
const { predictAuthenticity } = require('../services/mlService');
const { runTestCases } = require('../services/executionService');
const { generateReport } = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

// POST /api/sessions/start
const startSession = async (req, res) => {
  try {
    const { questionId, language } = req.body;
    
    // Check for existing session (Attempt Limit)
    const existing = await InterviewSession.findOne({ 
      candidate: req.user._id, 
      question: questionId,
      status: { $in: ['submitted', 'evaluated'] }
    });

    if (existing) {
      return res.status(403).json({ message: 'You have already completed an assessment for this question.' });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const session = await InterviewSession.create({
      candidate: req.user._id,
      question: questionId,
      language,
      status: 'in_progress',
      startTime: new Date(),
      totalTestCases: question.testCases.length,
    });

    await TelemetryLog.create({ session: session._id, candidate: req.user._id, events: [] });

    res.status(201).json({ session, starterCode: question.starterCode[language] || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/sessions/:id/submit
const submitSession = async (req, res) => {
  try {
    const { code } = req.body;
    const session = await InterviewSession.findById(req.params.id).populate('question candidate');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / 1000);

    // Run test cases
    const question = session.question;
    const { results, passed } = await runTestCases(code, session.language, question.testCases);

    // Get telemetry
    const telemetry = await TelemetryLog.findOne({ session: session._id });

    // Extract features
    const features = extractFeatures(telemetry || {}, duration);

    // ML prediction
    const prediction = await predictAuthenticity(features);
    const alerts = detectAlerts(telemetry || {});

    // Save ML prediction
    const mlPrediction = await MLPrediction.create({
      session: session._id,
      candidate: req.user._id,
      features,
      authenticityScore: prediction.authenticityScore,
      classification: prediction.classification,
      confidence: prediction.confidence,
      riskLevel: prediction.riskLevel,
      alerts: Array.isArray(alerts) ? alerts : [],
    });

    // Save alerts
    for (const alert of alerts) {
      await Alert.create({
        session: session._id,
        candidate: req.user._id,
        ...alert,
        timestamp: duration * 1000,
      });
    }

    // Update session
    session.status = 'submitted';
    session.endTime = endTime;
    session.duration = duration;
    session.finalCode = code;
    session.testCasesPassed = passed;
    session.compilationAttempts = telemetry?.compilationCount || 0;
    session.runtimeErrors = telemetry?.errorCount || 0;
    session.authenticityScore = prediction.authenticityScore;
    session.classification = prediction.classification;
    session.confidence = prediction.confidence;
    session.riskLevel = prediction.riskLevel;
    await session.save();

    // Generate PDF
    const candidate = await User.findById(req.user._id);
    const { filename } = await generateReport(session, telemetry, mlPrediction, candidate, question);
    session.reportPath = filename;
    session.reportGenerated = true;
    await session.save();

    res.json({ session, testResults: results, prediction, reportFilename: filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sessions/my
const getMySessions = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ candidate: req.user._id })
      .populate('question', 'title difficulty tags')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sessions/:id
const getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('question candidate', 'title difficulty tags name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const telemetry = await TelemetryLog.findOne({ session: session._id });
    const mlPrediction = await MLPrediction.findOne({ session: session._id });
    const alerts = await Alert.find({ session: session._id });
    res.json({ session, telemetry, mlPrediction, alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sessions/:id/report
const downloadReport = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session || !session.reportPath) return res.status(404).json({ message: 'Report not found' });
    const filepath = path.join(__dirname, '../reports', session.reportPath);
    if (!fs.existsSync(filepath)) return res.status(404).json({ message: 'Report file missing' });
    res.download(filepath, session.reportPath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sessions/assessments/my - Get candidate's assigned assessments
const getMyAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ candidates: req.user._id })
      .populate('recruiter', 'name email')
      .populate('questions', 'title difficulty tags')
      .sort({ createdAt: -1 });
    
    // For each assessment, include candidate's progress
    const enriched = await Promise.all(assessments.map(async (a) => {
      const sessions = await InterviewSession.find({
        candidate: req.user._id,
        question: { $in: a.questions.map(q => q._id) },
      });
      
      const progress = {
        totalQuestions: a.questions.length,
        completedQuestions: sessions.filter(s => ['submitted', 'evaluated'].includes(s.status)).length,
        inProgressQuestions: sessions.filter(s => s.status === 'in_progress').length,
        notStartedQuestions: a.questions.length - sessions.length,
      };
      
      return {
        ...a.toObject(),
        progress,
        sessions: sessions.map(s => ({ questionId: s.question, status: s.status, sessionId: s._id })),
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/sessions/start-from-assessment - Start session for a specific assessment question
const startSessionFromAssessment = async (req, res) => {
  try {
    const { assessmentId, questionId, language } = req.body;
    
    if (!assessmentId || !questionId || !language) {
      return res.status(400).json({ message: 'assessmentId, questionId, and language are required' });
    }

    // Check for existing session (Attempt Limit)
    const existing = await InterviewSession.findOne({ 
      candidate: req.user._id, 
      question: questionId,
      status: { $in: ['submitted', 'evaluated'] }
    });

    if (existing) {
      return res.status(403).json({ message: 'You have already completed this question in this assessment.' });
    }
    
    // Verify candidate is assigned to this assessment
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      candidates: req.user._id,
    });
    
    if (!assessment) {
      return res.status(403).json({ message: 'You are not assigned to this assessment' });
    }
    
    // Verify question is part of this assessment
    if (!assessment.questions.includes(questionId)) {
      return res.status(400).json({ message: 'Question is not part of this assessment' });
    }
    
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    const session = await InterviewSession.create({
      candidate: req.user._id,
      question: questionId,
      language,
      status: 'in_progress',
      startTime: new Date(),
      totalTestCases: question.testCases.length,
    });
    
    await TelemetryLog.create({ session: session._id, candidate: req.user._id, events: [] });
    
    res.status(201).json({ 
      session, 
      starterCode: question.starterCode[language] || '',
      question: {
        id: question._id,
        title: question.title,
        description: question.description,
        examples: question.examples,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { 
  startSession, submitSession, getMySessions, getSession, downloadReport,
  getMyAssessments, startSessionFromAssessment 
};
