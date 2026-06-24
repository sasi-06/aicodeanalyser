const mongoose = require('mongoose');

/**
 * TrainingData — stores recruiter-labeled sessions as ground-truth training samples.
 * Every time a recruiter confirms an audit decision, a document is saved here.
 * These documents are sent to the ML service /retrain endpoint on demand.
 */
const trainingDataSchema = new mongoose.Schema({
  session:   { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession' },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Behavioral telemetry features (ML model input)
  behavioralFeatures: {
    typing_speed:            { type: Number, default: 0 },
    average_pause_duration:  { type: Number, default: 0 },
    paste_ratio:             { type: Number, default: 0 },
    edit_frequency:          { type: Number, default: 0 },
    compile_attempts:        { type: Number, default: 0 },
    error_frequency:         { type: Number, default: 0 },
    code_growth_rate:        { type: Number, default: 0 },
    idle_ratio:              { type: Number, default: 0 },
    focus_loss_count:        { type: Number, default: 0 },
    off_screen_events_count: { type: Number, default: 0 },
    backspace_ratio:         { type: Number, default: 0 },
  },

  // Code quality features (from AST analysis)
  codeFeatures: {
    complexity:          { type: Number, default: 0 },
    function_count:      { type: Number, default: 0 },
    has_functions:       { type: Boolean, default: false },
    good_naming:         { type: Boolean, default: false },
    comment_ratio:       { type: Number, default: 0 },
    total_lines:         { type: Number, default: 0 },
    code_lines:          { type: Number, default: 0 },
    quality_score:       { type: Number, default: 0 },
    code_quality_score:  { type: Number, default: 0 },
  },

  // Ground truth — what recruiter decided (used as training label)
  humanLabel: {
    type: String,
    enum: ['Genuine', 'Review Needed', 'Suspicious'],
    required: true,
  },
  // Numeric label for ML (0=Suspicious, 1=Review Needed, 2=Genuine)
  numericLabel: { type: Number, required: true },

  // What the ML model originally predicted
  mlLabel:     { type: String },
  mlScore:     { type: Number },
  wasCorrect:  { type: Boolean },

  // Session metadata
  language:         { type: String },
  testCasesPassed:  { type: Number, default: 0 },
  totalTestCases:   { type: Number, default: 0 },
  finalScore:       { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TrainingData', trainingDataSchema);
