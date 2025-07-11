/**
 * Goals Routes
 * Handles all goal-related endpoints
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers and middleware
const goalController = require('../controllers/goalController');
const { authenticate, checkResourceOwnership } = require('../middleware/auth');
const { goalValidation, commonValidation } = require('../middleware/validation');

// Rate limiting for goals endpoints
const goalRateLimit = rateLimit({
  windowMs: parseInt(process.env.GOALS_RATE_LIMIT_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.GOALS_RATE_LIMIT_MAX) || 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many requests to goals API. Please try again later.',
    code: 'GOALS_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply authentication to all routes
router.use(authenticate);

// Apply rate limiting to all routes
router.use(goalRateLimit);

/**
 * @route   GET /api/v1/goals
 * @desc    Get all goals for authenticated user
 * @access  Private
 * @query   status, category, priority, page, limit, sort, search
 */
router.get('/',
  commonValidation.pagination,
  goalController.getGoals
);

/**
 * @route   POST /api/v1/goals
 * @desc    Create a new goal
 * @access  Private
 */
router.post('/',
  goalValidation.create,
  goalController.createGoal
);

/**
 * @route   GET /api/v1/goals/stats
 * @desc    Get goal statistics for authenticated user
 * @access  Private
 */
router.get('/stats',
  goalController.getGoalStats
);

/**
 * @route   GET /api/v1/goals/search
 * @desc    Search goals
 * @access  Private
 * @query   q (search query), category, status, priority
 */
router.get('/search',
  goalController.searchGoals
);

/**
 * @route   GET /api/v1/goals/overdue
 * @desc    Get overdue goals for authenticated user
 * @access  Private
 */
router.get('/overdue',
  goalController.getOverdueGoals
);

/**
 * @route   GET /api/v1/goals/category/:category
 * @desc    Get goals by category
 * @access  Private
 */
router.get('/category/:category',
  goalController.getGoalsByCategory
);

/**
 * @route   GET /api/v1/goals/:id
 * @desc    Get a single goal by ID
 * @access  Private
 */
router.get('/:id',
  commonValidation.mongoId,
  goalController.getGoal
);

/**
 * @route   PUT /api/v1/goals/:id
 * @desc    Update a goal
 * @access  Private
 */
router.put('/:id',
  goalValidation.update,
  goalController.updateGoal
);

/**
 * @route   DELETE /api/v1/goals/:id
 * @desc    Delete a goal
 * @access  Private
 */
router.delete('/:id',
  commonValidation.mongoId,
  goalController.deleteGoal
);

/**
 * @route   POST /api/v1/goals/:id/complete
 * @desc    Mark goal as completed
 * @access  Private
 */
router.post('/:id/complete',
  commonValidation.mongoId,
  goalController.completeGoal
);

/**
 * @route   POST /api/v1/goals/:id/sub-goals
 * @desc    Add a sub-goal to a goal
 * @access  Private
 */
router.post('/:id/sub-goals',
  goalValidation.addSubGoal,
  goalController.addSubGoal
);

/**
 * @route   PUT /api/v1/goals/:id/sub-goals/:subGoalId
 * @desc    Toggle sub-goal completion
 * @access  Private
 */
router.put('/:id/sub-goals/:subGoalId',
  commonValidation.mongoId,
  goalController.toggleSubGoal
);

/**
 * @route   POST /api/v1/goals/:id/time-sessions
 * @desc    Add time session to goal
 * @access  Private
 */
router.post('/:id/time-sessions',
  commonValidation.mongoId,
  goalController.addTimeSession
);

module.exports = router;
