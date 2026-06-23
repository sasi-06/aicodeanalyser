const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  events: [
    {
      type: { type: String, required: true }, // keypress, paste, blur, focus, compile, etc.
      timestamp: { type: Number, required: true }, // ms since session start
      data: { type: mongoose.Schema.Types.Mixed }, // event-specific payload
    },
  ],
  // Aggregated feature snapshot (updated in real-time)
  totalKeystrokes: { type: Number, default: 0 },
  totalCharsTyped: { type: Number, default: 0 },
  totalPasteCount: { type: Number, default: 0 },
  totalPasteChars: { type: Number, default: 0 },
  totalBackspaces: { type: Number, default: 0 },
  totalTabSwitches: { type: Number, default: 0 },
  totalBlurEvents: { type: Number, default: 0 },
  totalIdleTime: { type: Number, default: 0 }, // ms
  totalActiveTime: { type: Number, default: 0 }, // ms
  compilationCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  longestPause: { type: Number, default: 0 }, // ms
  averagePause: { type: Number, default: 0 }, // ms
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TelemetryLog', telemetryLogSchema);
