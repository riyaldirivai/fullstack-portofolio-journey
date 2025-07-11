/**
 * Timers Routes
 * Handles all timer-related endpoints
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers and middleware
const timerController = require('../controllers/timerController');
const { authenticate } = require('../middleware/auth');
const { timerValidation, commonValidation } = require('../middleware/validation');

// Rate limiting for timer endpoints
const timerRateLimit = rateLimit({
  windowMs: parseInt(process.env.TIMER_RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.TIMER_RATE_LIMIT_MAX) || 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many requests to timer API. Please try again later.',
    code: 'TIMER_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication to all routes
router.use(authenticate);

// Apply rate limiting to all routes
router.use(timerRateLimit);

/**
 * @route   GET /api/v1/timers
 * @desc    Get all timers for authenticated user
 * @access  Private
 * @query   type, status, goalId, page, limit, sort, startDate, endDate
 */
router.get('/',
  commonValidation.pagination,
  commonValidation.dateRange,
  timerController.getTimers
);

/**
 * @route   POST /api/v1/timers
 * @desc    Create and start a new timer
 * @access  Private
 */
router.post('/',
  timerValidation.create,
  timerController.createTimer
);

/**
 * @route   POST /api/v1/timers/start
 * @desc    Create and start a new timer (alias for backward compatibility)
 * @access  Private
 */
router.post('/start',
  timerValidation.create,
  timerController.createTimer
);

/**
 * @route   GET /api/v1/timers/active
 * @desc    Get currently active timer
 * @access  Private
 */
router.get('/active',
  timerController.getActiveTimer
);

/**
 * @route   GET /api/v1/timers/stats
 * @desc    Get timer statistics for authenticated user
 * @access  Private
 * @query   startDate, endDate
 */
router.get('/stats',
  commonValidation.dateRange,
  timerController.getTimerStats
);

/**
 * @route   GET /api/v1/timers/daily
 * @desc    Get daily timer statistics
 * @access  Private
 * @query   date (YYYY-MM-DD format, defaults to today)
 */
router.get('/daily',
  timerController.getDailyStats
);

/**
 * @route   GET /api/v1/timers/:id
 * @desc    Get a single timer by ID
 * @access  Private
 */
router.get('/:id',
  commonValidation.mongoId,
  timerController.getTimer
);

/**
 * @route   PUT /api/v1/timers/:id
 * @desc    Update a timer
 * @access  Private
 */
router.put('/:id',
  timerValidation.update,
  timerController.updateTimer
);

/**
 * @route   POST /api/v1/timers/:id/pause
 * @desc    Pause a running timer
 * @access  Private
 */
router.post('/:id/pause',
  commonValidation.mongoId,
  timerController.pauseTimer
);

/**
 * @route   POST /api/v1/timers/:id/resume
 * @desc    Resume a paused timer
 * @access  Private
 */
router.post('/:id/resume',
  commonValidation.mongoId,
  timerController.resumeTimer
);

/**
 * @route   POST /api/v1/timers/:id/complete
 * @desc    Complete a timer
 * @access  Private
 */
router.post('/:id/complete',
  commonValidation.mongoId,
  timerController.completeTimer
);

/**
 * @route   POST /api/v1/timers/:id/cancel
 * @desc    Cancel a timer
 * @access  Private
 */
router.post('/:id/cancel',
  commonValidation.mongoId,
  timerController.cancelTimer
);

/**
 * @route   POST /api/v1/timers/:id/interruptions
 * @desc    Add interruption to a timer
 * @access  Private
 */
router.post('/:id/interruptions',
  timerValidation.addInterruption,
  timerController.addInterruption
);

/**
 * @route   POST /api/v1/timers/:id/rate
 * @desc    Rate a completed timer session
 * @access  Private
 */
router.post('/:id/rate',
  commonValidation.mongoId,
  timerController.rateTimer
);

module.exports = router;
