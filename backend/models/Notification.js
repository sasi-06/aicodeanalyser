const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['assessment_assigned', 'alert', 'result_ready', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession' },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
