const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  language: { type: String, enum: ['python', 'javascript', 'java', 'cpp'], required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'submitted', 'evaluated'], default: 'not_started' },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number }, // seconds
  finalCode: { type: String, default: '' },
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  compilationAttempts: { type: Number, default: 0 },
  runtimeErrors: { type: Number, default: 0 },
  executionTime: { type: Number, default: 0 }, // ms
  memoryUsage: { type: Number, default: 0 }, // KB
  authenticityScore: { type: Number, default: null },
  classification: { type: String, enum: ['Genuine', 'Review Needed', 'Suspicious'], default: null },
  confidence: { type: Number, default: null },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: null },
  reportGenerated: { type: Boolean, default: false },
  reportPath: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
