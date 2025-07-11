/**
 * Timer Routes
 * Handles individual timer session endpoints
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers and middleware
const timerController = require('../controllers/timerController');
const { authenticate } = require('../middleware/auth');
const { timerValidation } = require('../middleware/validation');

// Rate limiting for timer endpoints
const timerLimit = rateLimit({
  windowMs: parseInt(process.env.TIMER_RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.TIMER_RATE_LIMIT_MAX) || 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many timer requests, please try again later.'
  }
});

// All timer routes require authentication
router.use(authenticate);
router.use(timerLimit);

// Timer session management
router.post('/start', timerValidation.startTimer, timerController.startTimer);
router.post('/stop', timerValidation.stopTimer, timerController.stopTimer);
router.post('/pause', timerValidation.pauseTimer, timerController.pauseTimer);
router.post('/resume', timerValidation.resumeTimer, timerController.resumeTimer);

// Get timer sessions
router.get('/sessions', timerController.getTimerSessions);
router.get('/sessions/:id', timerController.getTimerSession);

// Timer statistics
router.get('/stats', timerController.getTimerStats);
router.get('/stats/daily', timerController.getDailyStats);
router.get('/stats/weekly', timerController.getWeeklyStats);

// Delete timer session
router.delete('/sessions/:id', timerController.deleteTimerSession);

module.exports = router;
