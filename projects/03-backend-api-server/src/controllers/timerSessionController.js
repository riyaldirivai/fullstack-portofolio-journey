/**
 * TimerSession Controller
 * Handles timer session operations and pomodoro functionality
 */

const TimerSession = require('../models/TimerSession');
const Goal = require('../models/Goal');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Pomodoro Configuration
const POMODORO_SETTINGS = {
  pomodoro: 25,      // 25 minutes focus time
  focus: 50,         // 50 minutes deep focus
  break: 5,          // 5 minutes break
  custom: 25,        // Default custom duration
  cycles_before_long_break: 4  // Long break after 4 pomodoros
};

/**
 * Start a new timer session
 * @route POST /api/timer/start
 */
const startTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { 
    type = 'pomodoro', 
    title, 
    goalId, 
    plannedDuration,
    settings 
  } = req.body;

  // Check for existing active timer
  const existingTimer = await TimerSession.getActiveTimer(userId);
  if (existingTimer) {
    throw new AppError('You already have an active timer. Please complete or cancel it first.', 400, 'ACTIVE_TIMER_EXISTS');
  }

  // Validate goal if provided
  if (goalId) {
    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }
  }

  // Set default duration based on type if not provided
  const duration = plannedDuration || POMODORO_SETTINGS[type] || 25;

  // Create timer session
  const timerData = {
    userId,
    goalId: goalId || null,
    type,
    title: title || (type === 'pomodoro' ? 'Focus Session' : 
                    type === 'focus' ? 'Deep Focus' :
                    type === 'break' ? 'Break' : 'Timer Session'),
    plannedDuration: duration,
    startTime: new Date(),
    status: 'running', // Changed from 'active' to 'running' to match schema
    settings: {
      autoStartBreaks: settings?.autoStartBreaks || false,
      soundEnabled: settings?.soundEnabled !== false,
      notifications: settings?.notifications !== false
    },
    deviceInfo: {
      platform: req.get('sec-ch-ua-platform'),
      browser: req.get('User-Agent'),
      userAgent: req.get('User-Agent')
    }
  };

  const timer = await TimerSession.create(timerData);

  // Populate references for response
  await timer.populate([
    { path: 'userId', select: 'firstName lastName email' },
    { path: 'goalId', select: 'title category description' }
  ]);

  logger.info(`Timer started: ${timer.title} (${timer.type}) by user: ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Timer started successfully',
    data: {
      session: {
        id: timer._id,
        type: timer.type,
        title: timer.title,
        plannedDuration: timer.plannedDuration,
        startTime: timer.startTime,
        status: timer.status,
        elapsedTime: timer.elapsedTime,
        remainingTime: timer.remainingTime,
        goal: timer.goalId,
        settings: timer.settings
      }
    }
  });
});

/**
 * Pause active timer
 * @route PUT /api/timer/pause
 */
const pauseTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const timer = await TimerSession.getActiveTimer(userId);
  if (!timer) {
    throw new AppError('No active timer found', 404, 'NO_ACTIVE_TIMER');
  }

  if (timer.status !== 'running') {
    throw new AppError('Timer is not running', 400, 'TIMER_NOT_RUNNING');
  }

  await timer.pause();

  logger.info(`Timer paused: ${timer.title} by user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Timer paused successfully',
    data: {
      session: {
        id: timer._id,
        status: timer.status,
        pausedAt: timer.pausedAt,
        pauseCount: timer.pauseCount,
        elapsedTime: timer.elapsedTime,
        remainingTime: timer.remainingTime
      }
    }
  });
});

/**
 * Resume paused timer
 * @route PUT /api/timer/resume
 */
const resumeTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const timer = await TimerSession.getActiveTimer(userId);
  if (!timer) {
    throw new AppError('No paused timer found', 404, 'NO_PAUSED_TIMER');
  }

  if (timer.status !== 'paused') {
    throw new AppError('Timer is not paused', 400, 'TIMER_NOT_PAUSED');
  }

  await timer.resume();

  logger.info(`Timer resumed: ${timer.title} by user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Timer resumed successfully',
    data: {
      session: {
        id: timer._id,
        status: timer.status,
        elapsedTime: timer.elapsedTime,
        remainingTime: timer.remainingTime,
        totalPausedTime: timer.totalPausedTime
      }
    }
  });
});

/**
 * Stop and complete timer
 * @route PUT /api/timer/stop
 */
const stopTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notes, rating } = req.body;

  const timer = await TimerSession.getActiveTimer(userId);
  if (!timer) {
    throw new AppError('No active timer found', 404, 'NO_ACTIVE_TIMER');
  }

  // Complete the timer
  await timer.complete();

  // Add notes if provided
  if (notes) {
    timer.notes = notes;
  }

  // Add rating if provided
  if (rating && rating >= 1 && rating <= 5) {
    timer.productivityRating = rating;
  }

  await timer.save();

  // Update user statistics
  await updateUserStats(userId, timer);

  // Update goal progress if timer was associated with a goal
  if (timer.goalId) {
    await updateGoalProgress(timer.goalId, timer.actualDuration);
  }

  logger.info(`Timer completed: ${timer.title} (${timer.actualDuration}min) by user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Timer completed successfully',
    data: {
      session: {
        id: timer._id,
        status: timer.status,
        actualDuration: timer.actualDuration,
        completionPercentage: timer.completionPercentage,
        endTime: timer.endTime,
        productivityRating: timer.productivityRating
      },
      stats: {
        totalTime: timer.actualDuration,
        efficiency: Math.round((timer.actualDuration / timer.plannedDuration) * 100)
      }
    }
  });
});

/**
 * Cancel active timer
 * @route PUT /api/timer/cancel
 */
const cancelTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const timer = await TimerSession.getActiveTimer(userId);
  if (!timer) {
    throw new AppError('No active timer found', 404, 'NO_ACTIVE_TIMER');
  }

  await timer.cancel();

  logger.info(`Timer cancelled: ${timer.title} by user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Timer cancelled successfully',
    data: {
      session: {
        id: timer._id,
        status: timer.status,
        actualDuration: timer.actualDuration,
        completionPercentage: timer.completionPercentage
      }
    }
  });
});

/**
 * Get active timer
 * @route GET /api/timer/active
 */
const getActiveTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const timer = await TimerSession.getActiveTimer(userId);
  
  if (!timer) {
    return res.status(200).json({
      success: true,
      message: 'No active timer found',
      data: { session: null }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      session: {
        id: timer._id,
        type: timer.type,
        title: timer.title,
        plannedDuration: timer.plannedDuration,
        startTime: timer.startTime,
        status: timer.status,
        elapsedTime: timer.elapsedTime,
        remainingTime: timer.remainingTime,
        pauseCount: timer.pauseCount,
        goal: timer.goalId,
        isExpired: timer.isExpired
      }
    }
  });
});

/**
 * Get timer history
 * @route GET /api/timer/history
 */
const getTimerHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 20,
    type,
    status,
    startDate,
    endDate
  } = req.query;

  // Build filter
  const filter = { userId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [timers, total] = await Promise.all([
    TimerSession.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('goalId', 'title category')
      .select('-deviceInfo -settings'),
    TimerSession.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      timers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTimers: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

/**
 * Get timer statistics
 * @route GET /api/timer/stats
 */
const getTimerStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { days = 7 } = req.query;

  const stats = await TimerSession.getPomodoroStats(userId, parseInt(days));

  // Calculate summary statistics
  const summary = await TimerSession.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalTime: { $sum: '$actualDuration' },
        avgDuration: { $avg: '$actualDuration' },
        avgCompletion: { $avg: '$completionPercentage' },
        totalBreaks: {
          $sum: {
            $cond: [
              { $in: ['$type', ['short_break', 'long_break']] },
              1,
              0
            ]
          }
        },
        totalPomodoros: {
          $sum: {
            $cond: [{ $eq: ['$type', 'pomodoro'] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: summary[0] || {
        totalSessions: 0,
        totalTime: 0,
        avgDuration: 0,
        avgCompletion: 0,
        totalBreaks: 0,
        totalPomodoros: 0
      },
      daily: stats
    }
  });
});

/**
 * Get next suggested timer type (for pomodoro cycles)
 * @route GET /api/timer/next
 */
const getNextTimer = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get recent completed timers to determine the cycle
  const recentTimers = await TimerSession.find({
    userId,
    status: 'completed',
    type: { $in: ['pomodoro', 'short_break', 'long_break'] }
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .select('type createdAt');

  let suggestion = {
    type: 'pomodoro',
    duration: POMODORO_SETTINGS.pomodoro,
    reason: 'Start your productivity session'
  };

  if (recentTimers.length > 0) {
    const lastTimer = recentTimers[0];
    const pomodoroCount = recentTimers.filter(t => t.type === 'pomodoro').length;

    if (lastTimer.type === 'pomodoro') {
      // After a pomodoro, suggest a break
      if (pomodoroCount % POMODORO_SETTINGS.cycles_before_long_break === 0) {
        suggestion = {
          type: 'long_break',
          duration: POMODORO_SETTINGS.long_break,
          reason: `Time for a long break! You've completed ${pomodoroCount} pomodoros.`
        };
      } else {
        suggestion = {
          type: 'short_break',
          duration: POMODORO_SETTINGS.short_break,
          reason: 'Take a short break before the next focus session'
        };
      }
    } else {
      // After a break, suggest a pomodoro
      suggestion = {
        type: 'pomodoro',
        duration: POMODORO_SETTINGS.pomodoro,
        reason: 'Ready for another focus session!'
      };
    }
  }

  res.status(200).json({
    success: true,
    data: {
      suggestion,
      cycle: {
        completed_pomodoros_today: recentTimers.filter(t => 
          t.type === 'pomodoro' && 
          t.createdAt >= new Date().setHours(0, 0, 0, 0)
        ).length,
        settings: POMODORO_SETTINGS
      }
    }
  });
});

// Helper function to update user statistics
const updateUserStats = async (userId, timer) => {
  try {
    const user = await User.findById(userId);
    if (user && user.updateStats) {
      await user.updateStats({
        totalTimeTracked: (user.stats?.totalTimeTracked || 0) + timer.actualDuration,
        totalTimerSessions: (user.stats?.totalTimerSessions || 0) + 1
      });
    }
  } catch (error) {
    logger.warn(`Failed to update user stats: ${error.message}`);
  }
};

// Helper function to update goal progress
const updateGoalProgress = async (goalId, duration) => {
  try {
    const goal = await Goal.findById(goalId);
    if (goal) {
      goal.timeSpent = (goal.timeSpent || 0) + duration;
      await goal.save();
    }
  } catch (error) {
    logger.warn(`Failed to update goal progress: ${error.message}`);
  }
};

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  cancelTimer,
  getActiveTimer,
  getTimerHistory,
  getTimerStats,
  getNextTimer
};
