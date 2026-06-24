const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Question = require('./models/Question');
const InterviewSession = require('./models/InterviewSession');
const TelemetryLog = require('./models/TelemetryLog');
const MLPrediction = require('./models/MLPrediction');
const Alert = require('./models/Alert');
const User = require('./models/User');
const { extractFeatures, detectAlerts } = require('./utils/featureExtractor');
const { predictAuthenticity } = require('./services/mlService');
const { runTestCases } = require('./services/executionService');
const { generateReport } = require('./services/pdfService');

async function debugSubmit() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aicodeanalyser');
  console.log("Connected to MongoDB.");

  // Get latest in_progress session
  const session = await InterviewSession.findOne({ status: 'in_progress' }).populate('question candidate');
  if (!session) {
    console.log("No in_progress session found.");
    process.exit(1);
  }

  console.log("Found session:", session._id);

  try {
    const code = "public class Main { public static void main(String[] args) { } }";
    const endTime = new Date();
    const duration = Math.round((endTime - session.startTime) / 1000);

    const question = session.question;
    console.log("Running test cases...");
    const { results, passed } = await runTestCases(code, session.language, question.testCases);
    console.log("Test cases completed.");

    const telemetry = await TelemetryLog.findOne({ session: session._id });
    const features = extractFeatures(telemetry || {}, duration);

    console.log("Predicting authenticity...");
    const prediction = await predictAuthenticity(features);
    const alerts = detectAlerts(telemetry || {});

    console.log("Saving MLPrediction...");
    const mlPrediction = await MLPrediction.create({
      session: session._id,
      candidate: session.candidate._id,
      features,
      authenticityScore: prediction.authenticityScore,
      classification: prediction.classification,
      confidence: prediction.confidence,
      riskLevel: prediction.riskLevel,
      alerts: Array.isArray(alerts) ? alerts : [],
    });

    console.log("Saving alerts...");
    for (const alert of alerts) {
      await Alert.create({
        session: session._id,
        candidate: session.candidate._id,
        ...alert,
        timestamp: duration * 1000,
      });
    }

    console.log("Generating report...");
    const candidate = await User.findById(session.candidate._id);
    const { filename } = await generateReport(session, telemetry, mlPrediction, candidate, question);

    console.log("SUCCESS. No crash occurred. Filename:", filename);
  } catch (err) {
    console.error("CRASHED!");
    console.error(err.stack);
  }

  process.exit(0);
}

debugSubmit();
