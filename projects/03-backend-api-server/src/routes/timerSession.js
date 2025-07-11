/**
 * Timer Session Routes
 * Handles all timer session endpoints for pomodoro functionality
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers and middleware
const timerSessionController = require('../controllers/timerSessionController');
const { authenticate } = require('../middleware/auth');
const { body, query, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

// Rate limiting for timer endpoints
const timerLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many timer requests, please try again later.'
  }
});

// All timer routes require authentication
router.use(authenticate);
router.use(timerLimit);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array());
  }
  next();
};

// Validation rules
const startTimerValidation = [
  body('type')
    .optional()
    .isIn(['pomodoro', 'focus', 'break', 'custom'])
    .withMessage('Type must be one of: pomodoro, focus, break, custom'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
  body('plannedDuration')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Planned duration must be between 1 and 480 minutes'),
  body('goalId')
    .optional()
    .isMongoId()
    .withMessage('Goal ID must be a valid MongoDB ObjectId'),
  body('settings.autoStartBreaks')
    .optional()
    .isBoolean()
    .withMessage('autoStartBreaks must be a boolean'),
  body('settings.soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('soundEnabled must be a boolean'),
  body('settings.notifications')
    .optional()
    .isBoolean()
    .withMessage('notifications must be a boolean')
];

const stopTimerValidation = [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

const historyValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('type')
    .optional()
    .isIn(['pomodoro', 'focus', 'break', 'custom'])
    .withMessage('Type must be valid timer type: pomodoro, focus, break, custom'),
  query('status')
    .optional()
    .isIn(['running', 'paused', 'completed', 'cancelled', 'expired'])
    .withMessage('Status must be valid timer status: running, paused, completed, cancelled, expired'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

const statsValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

/**
 * @route   POST /api/timer/start
 * @desc    Start a new timer session
 * @access  Private
 * @body    { type?, title?, plannedDuration?, goalId?, settings? }
 */
router.post('/start', 
  startTimerValidation,
  handleValidationErrors,
  timerSessionController.startTimer
);

/**
 * @route   PUT /api/timer/pause
 * @desc    Pause the active timer
 * @access  Private
 */
router.put('/pause', 
  timerSessionController.pauseTimer
);

/**
 * @route   PUT /api/timer/resume
 * @desc    Resume the paused timer
 * @access  Private
 */
router.put('/resume', 
  timerSessionController.resumeTimer
);

/**
 * @route   PUT /api/timer/stop
 * @desc    Stop and complete the active timer
 * @access  Private
 * @body    { notes?, rating? }
 */
router.put('/stop', 
  stopTimerValidation,
  handleValidationErrors,
  timerSessionController.stopTimer
);

/**
 * @route   PUT /api/timer/cancel
 * @desc    Cancel the active timer
 * @access  Private
 */
router.put('/cancel', 
  timerSessionController.cancelTimer
);

/**
 * @route   GET /api/timer/active
 * @desc    Get the currently active timer
 * @access  Private
 */
router.get('/active', 
  timerSessionController.getActiveTimer
);

/**
 * @route   GET /api/timer/history
 * @desc    Get timer session history
 * @access  Private
 * @query   { page?, limit?, type?, status?, startDate?, endDate? }
 */
router.get('/history', 
  historyValidation,
  handleValidationErrors,
  timerSessionController.getTimerHistory
);

/**
 * @route   GET /api/timer/stats
 * @desc    Get timer statistics and analytics
 * @access  Private
 * @query   { days? }
 */
router.get('/stats', 
  statsValidation,
  handleValidationErrors,
  timerSessionController.getTimerStats
);

/**
 * @route   GET /api/timer/next
 * @desc    Get next suggested timer type (for pomodoro cycles)
 * @access  Private
 */
router.get('/next', 
  timerSessionController.getNextTimer
);

module.exports = router;
