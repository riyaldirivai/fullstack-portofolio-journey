/**
 * Dashboard Controller
 * Handles dashboard analytics and statistics logic
 */

const User = require('../models/User');
const Goal = require('../models/Goal');
const Timer = require('../models/Timer');
const TimerSession = require('../models/TimerSession');
const { AppError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const moment = require('moment');

/**
 * Get dashboard statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  // Get total counts
  const totalGoals = await Goal.countDocuments({ userId: userId });
  const completedGoals = await Goal.countDocuments({ userId: userId, status: 'completed' });
  const activeGoals = await Goal.countDocuments({ userId: userId, status: 'active' });

  // Get timer statistics
  const totalTimerSessions = await Timer.countDocuments({ userId: userId });
  const totalTimeSpent = await Timer.aggregate([
    { $match: { userId: userId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);

  // Calculate completion rate
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Get today's stats
  const today = moment().startOf('day');
  const todayGoalsCompleted = await Goal.countDocuments({
    userId: userId,
    status: 'completed',
    updatedAt: { $gte: today.toDate() }
  });

  const todayTimeSpent = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: today.toDate() }
      }
    },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);

  res.json({
    success: true,
    data: {
      goals: {
        total: totalGoals,
        completed: completedGoals,
        active: activeGoals,
        completionRate: Math.round(completionRate)
      },
      timer: {
        totalSessions: totalTimerSessions,
        totalTimeSpent: totalTimeSpent[0]?.total || 0
      },
      today: {
        goalsCompleted: todayGoalsCompleted,
        timeSpent: todayTimeSpent[0]?.total || 0
      }
    }
  });
});

/**
 * Get recent activities
 */
const getRecentActivities = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Get recent goals
  const recentGoals = await Goal.find({ userId: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .select('title status updatedAt');

  // Get recent timer sessions (checking both models for comprehensive results)
  const [recentTimers, recentTimerSessions] = await Promise.all([
    Timer.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('goalId', 'title')
      .select('goalId actualDuration status createdAt name'),
    TimerSession.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('goalId', 'title')
      .select('goalId actualDuration status createdAt title')
  ]);

  // Combine and sort activities from all sources
  const activities = [
    ...recentGoals.map(goal => ({
      type: 'goal',
      id: goal._id,
      title: goal.title,
      status: goal.status,
      timestamp: goal.updatedAt
    })),
    ...recentTimers.map(timer => ({
      type: 'timer',
      id: timer._id,
      title: timer.name || `Timer session${timer.goalId ? ` for ${timer.goalId.title}` : ''}`,
      duration: timer.actualDuration,
      status: timer.status,
      timestamp: timer.createdAt
    })),
    ...recentTimerSessions.map(session => ({
      type: 'timer-session',
      id: session._id,
      title: session.title || `Focus session${session.goalId ? ` for ${session.goalId.title}` : ''}`,
      duration: session.actualDuration,
      status: session.status,
      timestamp: session.createdAt
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

  res.json({
    success: true,
    data: {
      activities: activities
    }
  });
});

/**
 * Get productivity metrics
 */
const getProductivityMetrics = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const days = parseInt(req.query.days) || 7;
  const startDate = moment().subtract(days, 'days').startOf('day');

  // Get daily goal completions
  const dailyGoalCompletions = await Goal.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        updatedAt: { $gte: startDate.toDate() }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' },
          day: { $dayOfMonth: '$updatedAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  // Get daily time spent
  const dailyTimeSpent = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startDate.toDate() }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalTime: { $sum: '$duration' },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      dailyGoalCompletions,
      dailyTimeSpent
    }
  });
});

/**
 * Get goals summary
 */
const getGoalsSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;

  // Get goals by category
  const goalsByCategory = await Goal.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    }
  ]);

  // Get goals by priority
  const goalsByPriority = await Goal.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      byCategory: goalsByCategory,
      byPriority: goalsByPriority
    }
  });
});

/**
 * Get timer statistics
 */
const getTimerStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get timer sessions by type
  const sessionsByType = await Timer.aggregate([
    { $match: { userId: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalTime: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);

  // Get average session length
  const avgSessionLength = await Timer.aggregate([
    { $match: { userId: userId, status: 'completed' } },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
  ]);

  // Get most productive hours
  const productiveHours = await Timer.aggregate([
    { $match: { userId: userId, status: 'completed' } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        totalTime: { $sum: '$duration' },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { totalTime: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      sessionsByType,
      averageSessionLength: avgSessionLength[0]?.avgDuration || 0,
      mostProductiveHours: productiveHours
    }
  });
});

/**
 * Get weekly report
 */
const getWeeklyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const startOfWeek = moment().startOf('week');
  const endOfWeek = moment().endOf('week');

  // Get weekly goals completed
  const weeklyGoals = await Goal.countDocuments({
    userId: userId,
    status: 'completed',
    updatedAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
  });

  // Get weekly time spent
  const weeklyTime = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
      }
    },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);

  // Get daily breakdown
  const dailyBreakdown = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        totalTime: { $sum: '$duration' },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      period: {
        start: startOfWeek.format('YYYY-MM-DD'),
        end: endOfWeek.format('YYYY-MM-DD')
      },
      goalsCompleted: weeklyGoals,
      totalTimeSpent: weeklyTime[0]?.total || 0,
      dailyBreakdown
    }
  });
});

/**
 * Get monthly report
 */
const getMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const startOfMonth = moment().startOf('month');
  const endOfMonth = moment().endOf('month');

  // Get monthly goals completed
  const monthlyGoals = await Goal.countDocuments({
    userId: userId,
    status: 'completed',
    updatedAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
  });

  // Get monthly time spent
  const monthlyTime = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
      }
    },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);

  // Get weekly breakdown
  const weeklyBreakdown = await Timer.aggregate([
    {
      $match: {
        userId: userId,
        status: 'completed',
        createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
      }
    },
    {
      $group: {
        _id: { $week: '$createdAt' },
        totalTime: { $sum: '$duration' },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.json({
    success: true,
    data: {
      period: {
        start: startOfMonth.format('YYYY-MM-DD'),
        end: endOfMonth.format('YYYY-MM-DD')
      },
      goalsCompleted: monthlyGoals,
      totalTimeSpent: monthlyTime[0]?.total || 0,
      weeklyBreakdown
    }
  });
});

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getProductivityMetrics,
  getGoalsSummary,
  getTimerStats,
  getWeeklyReport,
  getMonthlyReport
};
