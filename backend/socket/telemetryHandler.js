const TelemetryLog = require('../models/TelemetryLog');
const Alert = require('../models/Alert');
const InterviewSession = require('../models/InterviewSession');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active recruiters watching sessions  { sessionId: [socket] }
const recruiterWatchers = {};

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user?.name} (${socket.user?.role})`);

    // ── AUTO-JOIN user-specific room for notifications
    if (socket.user?._id) {
      socket.join(`user:${socket.user._id}`);
      console.log(`📬 ${socket.user.name} joined notification room user:${socket.user._id}`);
    }

    // ── CANDIDATE joins their session room
    socket.on('join_session', async ({ sessionId }) => {
      socket.join(`session:${sessionId}`);
      socket.currentSession = sessionId;
      console.log(`📡 ${socket.user.name} joined session ${sessionId}`);
    });

    // ── RECRUITER watches a session
    socket.on('watch_session', ({ sessionId }) => {
      socket.join(`watch:${sessionId}`);
      if (!recruiterWatchers[sessionId]) recruiterWatchers[sessionId] = [];
      recruiterWatchers[sessionId].push(socket.id);
      console.log(`👁  Recruiter ${socket.user.name} watching ${sessionId}`);
    });

    // ── TELEMETRY: batch event ingestion
    socket.on('telemetry_batch', async (payload) => {
      const { sessionId, events } = payload;
      if (!sessionId || !events?.length) return;

      try {
        const telemetry = await TelemetryLog.findOne({ session: sessionId });
        if (!telemetry) return;

        // Append events
        telemetry.events.push(...events);

        // Update aggregates from events
        for (const event of events) {
          switch (event.type) {
            case 'keypress':
              telemetry.totalKeystrokes++;
              telemetry.totalCharsTyped += event.data?.char ? 1 : 0;
              break;
            case 'backspace':
              telemetry.totalBackspaces++;
              break;
            case 'paste':
              telemetry.totalPasteCount++;
              telemetry.totalPasteChars += event.data?.length || 0;
              // Real-time alert for large paste
              if ((event.data?.length || 0) > 100) {
                const alert = await Alert.create({
                  session: sessionId,
                  candidate: socket.user._id,
                  type: 'large_paste',
                  severity: 'high',
                  message: `Large paste detected: ${event.data.length} characters`,
                  timestamp: event.timestamp,
                });
                io.to(`watch:${sessionId}`).emit('live_alert', alert);
              }
              break;
            case 'tab_switch':
              telemetry.totalTabSwitches++;
              io.to(`watch:${sessionId}`).emit('live_alert', {
                type: 'tab_switch', severity: 'medium',
                message: `Tab switch by ${socket.user.name}`, timestamp: event.timestamp,
              });
              break;
            case 'blur':
              telemetry.totalBlurEvents++;
              break;
            case 'compile':
              telemetry.compilationCount++;
              break;
            case 'compile_error':
              telemetry.errorCount++;
              break;
            case 'idle_start':
              break;
            case 'idle_end':
              telemetry.totalIdleTime += event.data?.duration || 0;
              break;
          }
        }

        // Update pause stats from keypress events
        const keypressEvents = telemetry.events.filter(e => e.type === 'keypress');
        if (keypressEvents.length > 1) {
          const pauses = [];
          for (let i = 1; i < keypressEvents.length; i++) {
            const gap = keypressEvents[i].timestamp - keypressEvents[i - 1].timestamp;
            if (gap > 500) pauses.push(gap); // Only real pauses
          }
          if (pauses.length) {
            telemetry.averagePause = pauses.reduce((a, b) => a + b, 0) / pauses.length;
            telemetry.longestPause = Math.max(...pauses);
          }
        }

        telemetry.updatedAt = new Date();
        await telemetry.save();

        // Forward live telemetry to recruiter watchers
        io.to(`watch:${sessionId}`).emit('live_telemetry', {
          totalKeystrokes: telemetry.totalKeystrokes,
          totalPasteCount: telemetry.totalPasteCount,
          totalBlurEvents: telemetry.totalBlurEvents,
          compilationCount: telemetry.compilationCount,
          averagePause: telemetry.averagePause,
        });
      } catch (err) {
        console.error('Telemetry error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.user?.name}`);
    });
  });
};

module.exports = { setupSocket };
