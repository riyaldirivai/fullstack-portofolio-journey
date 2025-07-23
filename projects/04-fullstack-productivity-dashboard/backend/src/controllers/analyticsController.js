const Goal = require("../models/Goal");
const TimerSession = require("../models/TimerSession");
const User = require("../models/User");
const logger = require("../utils/logger");

class AnalyticsController {
  // Get dashboard overview
  async getDashboardOverview(req, res) {
    try {
      const userId = req.userId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Goals statistics
      const totalGoals = await Goal.countDocuments({ userId });
      const completedGoals = await Goal.countDocuments({
        userId,
        status: "completed",
      });
      const activeGoals = await Goal.countDocuments({
        userId,
        status: "active",
      });

      // Timer statistics for today
      const todayTimerSessions = await TimerSession.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
          },
        },
      ]);

      // Weekly progress
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyProgress = await TimerSession.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: weekAgo },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            sessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Recent activity
      const recentActivity = await TimerSession.find({
        userId,
        status: "completed",
      })
        .populate("goalId", "title")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        goals: {
          total: totalGoals,
          completed: completedGoals,
          active: activeGoals,
          completionRate:
            totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0,
        },
        today: {
          sessions: todayTimerSessions[0]?.totalSessions || 0,
          totalTime: todayTimerSessions[0]?.totalTime || 0,
        },
        weeklyProgress,
        recentActivity,
      });
    } catch (error) {
      logger.error("Get dashboard overview error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get productivity analytics
  async getProductivityAnalytics(req, res) {
    try {
      const userId = req.userId;
      const { period = "30" } = req.query; // days

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Daily productivity trends
      const dailyTrends = await TimerSession.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: daysAgo },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              type: "$type",
            },
            sessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
          },
        },
        {
          $group: {
            _id: "$_id.date",
            data: {
              $push: {
                type: "$_id.type",
                sessions: "$sessions",
                totalTime: "$totalTime",
              },
            },
            totalSessions: { $sum: "$sessions" },
            totalTime: { $sum: "$totalTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Goal category performance
      const categoryPerformance = await Goal.aggregate([
        {
          $match: { userId },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $group: {
            _id: "$categoryInfo.name",
            totalGoals: { $sum: 1 },
            completedGoals: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            avgProgress: {
              $avg: {
                $divide: ["$currentValue", "$targetValue"],
              },
            },
          },
        },
      ]);

      // Time distribution by goal
      const timeByGoal = await TimerSession.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: daysAgo },
            status: "completed",
            goalId: { $exists: true },
          },
        },
        {
          $lookup: {
            from: "goals",
            localField: "goalId",
            foreignField: "_id",
            as: "goal",
          },
        },
        {
          $group: {
            _id: "$goal.title",
            totalTime: { $sum: "$elapsedTime" },
            sessions: { $sum: 1 },
          },
        },
        { $sort: { totalTime: -1 } },
        { $limit: 10 },
      ]);

      res.json({
        period: parseInt(period),
        dailyTrends,
        categoryPerformance,
        timeByGoal,
      });
    } catch (error) {
      logger.error("Get productivity analytics error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get goal analytics
  async getGoalAnalytics(req, res) {
    try {
      const userId = req.userId;

      // Goal completion trends
      const completionTrends = await Goal.aggregate([
        {
          $match: {
            userId,
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$completedAt" },
            },
            completed: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Goals by priority
      const goalsByPriority = await Goal.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$priority",
            count: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]);

      // Average completion time
      const avgCompletionTime = await Goal.aggregate([
        {
          $match: {
            userId,
            status: "completed",
            completedAt: { $exists: true },
          },
        },
        {
          $project: {
            completionTime: {
              $subtract: ["$completedAt", "$createdAt"],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$completionTime" },
          },
        },
      ]);

      res.json({
        completionTrends,
        goalsByPriority,
        avgCompletionTime: avgCompletionTime[0]?.avgTime || 0,
      });
    } catch (error) {
      logger.error("Get goal analytics error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get time tracking analytics
  async getTimeAnalytics(req, res) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      const matchQuery = { userId, status: "completed" };
      if (startDate && endDate) {
        matchQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Hourly distribution
      const hourlyDistribution = await TimerSession.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $hour: "$startTime" },
            sessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Session duration distribution
      const durationDistribution = await TimerSession.aggregate([
        { $match: matchQuery },
        {
          $bucket: {
            groupBy: "$elapsedTime",
            boundaries: [0, 900000, 1800000, 2700000, 3600000, Infinity], // 15min, 30min, 45min, 1hr, more
            default: "other",
            output: {
              count: { $sum: 1 },
              avgDuration: { $avg: "$elapsedTime" },
            },
          },
        },
      ]);

      // Most productive days
      const productiveDays = await TimerSession.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: {
              dayOfWeek: { $dayOfWeek: "$createdAt" },
              dayName: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 1] },
                      then: "Sunday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 2] },
                      then: "Monday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 3] },
                      then: "Tuesday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 4] },
                      then: "Wednesday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 5] },
                      then: "Thursday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 6] },
                      then: "Friday",
                    },
                    {
                      case: { $eq: [{ $dayOfWeek: "$createdAt" }, 7] },
                      then: "Saturday",
                    },
                  ],
                },
              },
            },
            sessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
            avgTime: { $avg: "$elapsedTime" },
          },
        },
        { $sort: { "_id.dayOfWeek": 1 } },
      ]);

      res.json({
        hourlyDistribution,
        durationDistribution,
        productiveDays,
      });
    } catch (error) {
      logger.error("Get time analytics error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new AnalyticsController();
