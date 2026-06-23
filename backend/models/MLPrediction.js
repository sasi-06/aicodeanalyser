const mongoose = require('mongoose');

const mlPredictionSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Feature vector sent to ML
  features: {
    typing_speed: Number,
    average_pause_duration: Number,
    paste_ratio: Number,
    edit_frequency: Number,
    compile_attempts: Number,
    error_frequency: Number,
    code_growth_rate: Number,
    idle_ratio: Number,
    focus_loss_count: Number,
    backspace_ratio: Number,
  },
  // ML output
  authenticityScore: { type: Number, required: true },
  classification: { type: String, enum: ['Genuine', 'Review Needed', 'Suspicious'] },
  confidence: { type: Number },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
  featureImportance: { type: mongoose.Schema.Types.Mixed },
  alerts: [{
    type: { type: String },
    severity: String,
    message: String
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MLPrediction', mlPredictionSchema);
