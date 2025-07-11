/**
 * Timer Controller
 * Handles timer sessions for productivity tracking
 */

const Timer = require('../models/Timer');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Get all timers for a user
const getTimers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    type,
    status,
    goalId,
    page = 1,
    limit = 10,
    sort = '-createdAt',
    startDate,
    endDate
  } = req.query;

  // Build filter object
  const filter = { userId };
  
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (goalId) filter.goalId = goalId;
  
  // Date range filter
  if (startDate || endDate) {
    filter.startTime = {};
    if (startDate) filter.startTime.$gte = new Date(startDate);
    if (endDate) filter.startTime.$lte = new Date(endDate);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get timers with pagination
  const [timers, total] = await Promise.all([
    Timer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email')
      .populate('goalId', 'title category'),
    Timer.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.status(200).json({
    success: true,
    data: {
      timers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTimers: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    }
  });
});

// Get a single timer by ID
const getTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId })
    .populate('userId', 'firstName lastName email')
    .populate('goalId', 'title category description');

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { timer }
  });
});

// Create a new timer
const createTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const timerData = { 
    ...req.body, 
    userId,
    startTime: new Date(),
    deviceInfo: {
      platform: req.get('sec-ch-ua-platform'),
      browser: req.get('User-Agent'),
      userAgent: req.get('User-Agent')
    }
  };

  // Validate goal if provided
  if (timerData.goalId) {
    const goal = await Goal.findOne({ _id: timerData.goalId, userId });
    if (!goal) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }
  }

  // Check for active timers
  const activeTimer = await Timer.findOne({ 
    userId, 
    status: { $in: ['running', 'paused'] } 
  });

  if (activeTimer) {
    throw new AppError('You already have an active timer. Please complete or cancel it first.', 400, 'ACTIVE_TIMER_EXISTS');
  }

  // Create timer
  const timer = await Timer.create(timerData);

  logger.info(`New timer started: ${timer.name} by user: ${req.user.email}`);

  // Populate references for response
  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(201).json({
    success: true,
    message: 'Timer started successfully',
    data: { timer }
  });
});

// Update a timer
const updateTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  // Update timer
  Object.assign(timer, updates);
  await timer.save();

  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Timer updated successfully',
    data: { timer }
  });
});

// Pause a timer
const pauseTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  if (timer.status !== 'running') {
    throw new AppError('Can only pause running timers', 400, 'TIMER_NOT_RUNNING');
  }

  // Pause timer
  timer.pauseTimer(reason);
  await timer.save();

  logger.info(`Timer paused: ${timer.name} by user: ${req.user.email}`);

  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Timer paused successfully',
    data: { timer }
  });
});

// Resume a timer
const resumeTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  if (timer.status !== 'paused') {
    throw new AppError('Can only resume paused timers', 400, 'TIMER_NOT_PAUSED');
  }

  // Resume timer
  timer.resumeTimer();
  await timer.save();

  logger.info(`Timer resumed: ${timer.name} by user: ${req.user.email}`);

  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Timer resumed successfully',
    data: { timer }
  });
});

// Complete a timer
const completeTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'finished' } = req.body;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  if (!['running', 'paused'].includes(timer.status)) {
    throw new AppError('Can only complete running or paused timers', 400, 'TIMER_NOT_ACTIVE');
  }

  // Complete timer
  timer.completeTimer(reason);
  await timer.save();

  // Update related goal if exists
  if (timer.goalId && timer.effectiveDuration > 0) {
    const goal = await Goal.findById(timer.goalId);
    if (goal) {
      goal.addTimeSession(timer.startTime, timer.endTime, `Timer session: ${timer.name}`);
      await goal.save();
    }
  }

  // Update user stats
  const user = req.user;
  user.updateStats({
    totalTimeTracked: user.stats.totalTimeTracked + timer.effectiveDuration
  });
  await user.save();

  logger.info(`Timer completed: ${timer.name} by user: ${req.user.email}, Duration: ${timer.effectiveDuration} minutes`);

  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Timer completed successfully',
    data: { timer }
  });
});

// Cancel a timer
const cancelTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = 'cancelled' } = req.body;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  if (!['running', 'paused'].includes(timer.status)) {
    throw new AppError('Can only cancel running or paused timers', 400, 'TIMER_NOT_ACTIVE');
  }

  // Cancel timer
  timer.cancelTimer(reason);
  await timer.save();

  logger.info(`Timer cancelled: ${timer.name} by user: ${req.user.email}`);

  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  res.status(200).json({
    success: true,
    message: 'Timer cancelled successfully',
    data: { timer }
  });
});

// Add interruption to timer
const addInterruption = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, description, duration } = req.body;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  // Add interruption
  timer.addInterruption(type, description, duration);
  await timer.save();

  res.status(200).json({
    success: true,
    message: 'Interruption added successfully',
    data: { timer }
  });
});

// Rate a timer session
const rateTimer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { focusScore, productivityRating, energyLevel } = req.body;
  const userId = req.user._id;

  const timer = await Timer.findOne({ _id: id, userId });

  if (!timer) {
    throw new AppError('Timer not found', 404, 'TIMER_NOT_FOUND');
  }

  if (timer.status !== 'completed') {
    throw new AppError('Can only rate completed timers', 400, 'TIMER_NOT_COMPLETED');
  }

  // Rate timer
  timer.rateSession(focusScore, productivityRating, energyLevel);
  await timer.save();

  res.status(200).json({
    success: true,
    message: 'Timer rated successfully',
    data: { timer }
  });
});

// Get timer statistics
const getTimerStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { startDate, endDate } = req.query;

  const dateRange = {};
  if (startDate) dateRange.start = startDate;
  if (endDate) dateRange.end = endDate;

  const stats = await Timer.getUserTimerStats(userId, dateRange);

  // Get additional breakdowns
  const [typeStats, dailyStats] = await Promise.all([
    Timer.aggregate([
      { 
        $match: { 
          userId,
          ...(startDate && endDate ? {
            startTime: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }
      },
      { $group: { _id: '$type', count: { $sum: 1 }, totalTime: { $sum: '$actualDuration' } } },
      { $sort: { totalTime: -1 } }
    ]),
    Timer.aggregate([
      { 
        $match: { 
          userId,
          ...(startDate && endDate ? {
            startTime: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          } : {})
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          sessions: { $sum: 1 },
          totalTime: { $sum: '$actualDuration' },
          avgFocus: { $avg: '$focusScore' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: stats,
      breakdown: {
        byType: typeStats,
        daily: dailyStats
      }
    }
  });
});

// Get active timer
const getActiveTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const activeTimer = await Timer.findOne({ 
    userId, 
    status: { $in: ['running', 'paused'] } 
  })
  .populate('userId', 'firstName lastName email')
  .populate('goalId', 'title category description');

  res.status(200).json({
    success: true,
    data: { 
      activeTimer: activeTimer || null,
      hasActiveTimer: !!activeTimer
    }
  });
});

// Get daily timer stats
const getDailyStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { date = new Date().toISOString().split('T')[0] } = req.query;

  const stats = await Timer.getDailyStats(userId, date);

  res.status(200).json({
    success: true,
    data: {
      date,
      stats
    }
  });
});

module.exports = {
  getTimers,
  getTimer,
  createTimer,
  startTimer: createTimer, // Alias for backward compatibility
  updateTimer,
  pauseTimer,
  resumeTimer,
  stopTimer: completeTimer, // Alias for stop
  completeTimer,
  cancelTimer,
  addInterruption,
  rateTimer,
  getTimerStats,
  getActiveTimer,
  getDailyStats,
  getTimerSessions: getTimers, // Alias
  getTimerSession: getTimer, // Alias
  deleteTimerSession: cancelTimer // Alias
};
