const InterviewSession = require('../models/InterviewSession');
const TelemetryLog     = require('../models/TelemetryLog');
const MLPrediction     = require('../models/MLPrediction');
const Alert            = require('../models/Alert');
const Question         = require('../models/Question');
const User             = require('../models/User');
const Assessment       = require('../models/Assessment');

const { extractFeatures, detectAlerts }  = require('../utils/featureExtractor');
const { predictAuthenticity, generateConceptualQuestions } = require('../services/mlService');
const { analyzeCode }                    = require('../services/codeAnalysisService');
const { runTestCases }                   = require('../services/executionService');
const { generateReport }                 = require('../services/pdfService');
const path = require('path');
const fs   = require('fs');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Compute the combined final score from three dimensions:
 *   - Behavioral authenticity (40 %)
 *   - Code quality / AST analysis (35 %)
 *   - Test-case correctness (25 %)
 */
const computeFinalScore = (authenticityScore, codeQualityScore, testCasesPassed, totalTestCases) => {
  const testScore = totalTestCases > 0 ? (testCasesPassed / totalTestCases) * 100 : 50;
  const combined  = authenticityScore * 0.40 + codeQualityScore * 0.35 + testScore * 0.25;
  return Math.round(Math.min(100, Math.max(0, combined)));
};

// ─── POST /api/sessions/start ─────────────────────────────────────────────────

const startSession = async (req, res) => {
  try {
    const { questionId, language } = req.body;

    const existing = await InterviewSession.findOne({
      candidate: req.user._id,
      question:  questionId,
      status:    { $in: ['submitted', 'evaluated'] },
    });
    if (existing) {
      return res.status(403).json({ message: 'You have already completed an assessment for this question.' });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const session = await InterviewSession.create({
      candidate:      req.user._id,
      question:       questionId,
      language,
      status:         'in_progress',
      startTime:      new Date(),
      totalTestCases: question.testCases.length,
    });

    await TelemetryLog.create({ session: session._id, candidate: req.user._id, events: [] });

    res.status(201).json({ session, starterCode: question.starterCode[language] || '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── POST /api/sessions/:id/submit ────────────────────────────────────────────

const submitSession = async (req, res) => {
  try {
    const { code, conceptualAnswers } = req.body;
    const session = await InterviewSession.findById(req.params.id).populate('question candidate');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const endTime  = new Date();
    const duration = Math.round((endTime - session.startTime) / 1000);
    const question = session.question;

    // ── 1. Run test cases ──────────────────────────────────────────────────────
    const { results, passed } = await runTestCases(code, session.language, question.testCases);

    // ── 2. Get telemetry ───────────────────────────────────────────────────────
    const telemetry = await TelemetryLog.findOne({ session: session._id });

    // ── 3. Extract behavioral features ────────────────────────────────────────
    const features = extractFeatures(telemetry || {}, duration);

    // ── 4. Behavioral ML prediction (parallel with code analysis) ──────────────
    const [prediction, codeAnalysis] = await Promise.all([
      predictAuthenticity(features),
      analyzeCode(code, session.language, passed, question.testCases.length),
    ]);

    // ── 5. Detect rule-based alerts ────────────────────────────────────────────
    const alerts = detectAlerts(telemetry || {});

    // ── 6. Compute combined final score ────────────────────────────────────────
    const codeQualityScore = codeAnalysis.code_quality_score || 50;
    const finalScore = computeFinalScore(
      prediction.authenticityScore,
      codeQualityScore,
      passed,
      question.testCases.length
    );

    // ── 7. Save ML prediction ──────────────────────────────────────────────────
    const mlPrediction = await MLPrediction.create({
      session:   session._id,
      candidate: req.user._id,
      features: {
        ...features,
        off_screen_events_count: features.off_screen_events_count || 0,
      },
      authenticityScore: prediction.authenticityScore,
      classification:    prediction.classification,
      confidence:        prediction.confidence,
      riskLevel:         prediction.riskLevel,
      featureImportance: prediction.featureImportance || {},
      codeAnalysis,
      finalScore,
      alerts: Array.isArray(alerts) ? alerts : [],
    });

    // ── 8. Save behavioral alerts ──────────────────────────────────────────────
    for (const alert of alerts) {
      await Alert.create({
        session:   session._id,
        candidate: req.user._id,
        ...alert,
        timestamp: duration * 1000,
      });
    }

    // ── 9. Update session ──────────────────────────────────────────────────────
    session.status              = 'submitted';
    session.endTime             = endTime;
    session.duration            = duration;
    session.finalCode           = code;
    session.testCasesPassed     = passed;
    session.compilationAttempts = telemetry?.compilationCount || 0;
    session.runtimeErrors       = telemetry?.errorCount       || 0;
    session.authenticityScore   = prediction.authenticityScore;
    session.classification      = prediction.classification;
    session.confidence          = prediction.confidence;
    session.riskLevel           = prediction.riskLevel;
    session.codeQualityScore    = codeQualityScore;
    session.finalScore          = finalScore;
    session.updatedAt           = new Date();

    if (conceptualAnswers && Array.isArray(conceptualAnswers)) {
      session.conceptualAnswers = conceptualAnswers.map(ans => ({
        questionText: ans.questionText,
        candidateAnswer: ans.candidateAnswer || '',
        aiFeedback: (ans.candidateAnswer || '').trim().length > 30 
          ? "Detailed explanation provided. Awaiting recruiter verification."
          : "Short response provided. Review recommended.",
        score: null
      }));
    }

    await session.save();

    // ── 10. Generate PDF report ────────────────────────────────────────────────
    const candidate = await User.findById(req.user._id);
    const { filename } = await generateReport(session, telemetry, mlPrediction, candidate, question);
    session.reportPath      = filename;
    session.reportGenerated = true;
    await session.save();

    res.json({
      session,
      testResults:    results,
      prediction,
      codeAnalysis,
      finalScore,
      reportFilename: filename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/sessions/my ─────────────────────────────────────────────────────

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

// ─── GET /api/sessions/:id ────────────────────────────────────────────────────

const getSession = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('question candidate', 'title difficulty tags name email');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const telemetry    = await TelemetryLog.findOne({ session: session._id });
    const mlPrediction = await MLPrediction.findOne({ session: session._id });
    const alerts       = await Alert.find({ session: session._id });

    res.json({ session, telemetry, mlPrediction, alerts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/sessions/:id/report ─────────────────────────────────────────────

const downloadReport = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session || !session.reportPath)
      return res.status(404).json({ message: 'Report not found' });

    const filepath = path.join(__dirname, '../reports', session.reportPath);
    if (!fs.existsSync(filepath))
      return res.status(404).json({ message: 'Report file missing' });

    res.download(filepath, session.reportPath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET /api/sessions/assessments/my ────────────────────────────────────────

const getMyAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ candidates: req.user._id })
      .populate('recruiter', 'name email')
      .populate('questions', 'title difficulty tags')
      .sort({ createdAt: -1 });

    const enriched = await Promise.all(assessments.map(async (a) => {
      const sessions = await InterviewSession.find({
        candidate: req.user._id,
        question:  { $in: a.questions.map(q => q._id) },
      });

      const progress = {
        totalQuestions:     a.questions.length,
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

// ─── POST /api/sessions/start-from-assessment ─────────────────────────────────

const startSessionFromAssessment = async (req, res) => {
  try {
    const { assessmentId, questionId, language } = req.body;

    if (!assessmentId || !questionId || !language) {
      return res.status(400).json({ message: 'assessmentId, questionId, and language are required' });
    }

    const existing = await InterviewSession.findOne({
      candidate: req.user._id,
      question:  questionId,
      status:    { $in: ['submitted', 'evaluated'] },
    });
    if (existing) {
      return res.status(403).json({ message: 'You have already completed this question in this assessment.' });
    }

    const assessment = await Assessment.findOne({
      _id:        assessmentId,
      candidates: req.user._id,
    });
    if (!assessment) {
      return res.status(403).json({ message: 'You are not assigned to this assessment' });
    }
    if (!assessment.questions.includes(questionId)) {
      return res.status(400).json({ message: 'Question is not part of this assessment' });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const session = await InterviewSession.create({
      candidate:      req.user._id,
      question:       questionId,
      language,
      status:         'in_progress',
      startTime:      new Date(),
      totalTestCases: question.testCases.length,
    });

    await TelemetryLog.create({ session: session._id, candidate: req.user._id, events: [] });

    res.status(201).json({
      session,
      starterCode: question.starterCode[language] || '',
      question: {
        id:          question._id,
        title:       question.title,
        description: question.description,
        examples:    question.examples,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateQuestionsForSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body;

    const session = await InterviewSession.findById(id).populate('question');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Generate questions if not already generated
    if (!session.aiGeneratedQuestions || session.aiGeneratedQuestions.length === 0) {
      const generated = await generateConceptualQuestions(
        session.question.description,
        code || '',
        session.language
      );
      session.aiGeneratedQuestions = generated;
      session.finalCode = code || ''; // Save intermediate code state
      await session.save();
    }

    res.json({ questions: session.aiGeneratedQuestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  startSession, submitSession, getMySessions, getSession, downloadReport,
  getMyAssessments, startSessionFromAssessment, generateQuestionsForSession,
};
