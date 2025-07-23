const TimerSession = require("../models/TimerSession");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

class TimerController {
  // Start timer session
  async startTimer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, duration, goalId, taskName } = req.body;

      // Check if user has an active session
      const activeSession = await TimerSession.findOne({
        userId: req.userId,
        status: "active",
      });

      if (activeSession) {
        return res.status(400).json({
          message: "You already have an active timer session",
        });
      }

      const session = new TimerSession({
        userId: req.userId,
        type,
        duration,
        goalId,
        taskName,
        startTime: new Date(),
        status: "active",
      });

      await session.save();
      await session.populate("goalId");

      res.status(201).json(session);
    } catch (error) {
      logger.error("Start timer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Pause timer session
  async pauseTimer(req, res) {
    try {
      const session = await TimerSession.findOne({
        _id: req.params.id,
        userId: req.userId,
        status: "active",
      });

      if (!session) {
        return res
          .status(404)
          .json({ message: "Active timer session not found" });
      }

      session.status = "paused";
      session.pausedAt = new Date();

      // Calculate elapsed time
      const elapsed = session.pausedAt - session.startTime;
      session.elapsedTime = (session.elapsedTime || 0) + elapsed;

      await session.save();
      await session.populate("goalId");

      res.json(session);
    } catch (error) {
      logger.error("Pause timer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Resume timer session
  async resumeTimer(req, res) {
    try {
      const session = await TimerSession.findOne({
        _id: req.params.id,
        userId: req.userId,
        status: "paused",
      });

      if (!session) {
        return res
          .status(404)
          .json({ message: "Paused timer session not found" });
      }

      session.status = "active";
      session.startTime = new Date();
      session.pausedAt = null;

      await session.save();
      await session.populate("goalId");

      res.json(session);
    } catch (error) {
      logger.error("Resume timer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Complete timer session
  async completeTimer(req, res) {
    try {
      const session = await TimerSession.findOne({
        _id: req.params.id,
        userId: req.userId,
        status: { $in: ["active", "paused"] },
      });

      if (!session) {
        return res.status(404).json({ message: "Timer session not found" });
      }

      const endTime = new Date();
      session.endTime = endTime;
      session.status = "completed";

      // Calculate total elapsed time
      if (session.status === "active") {
        const elapsed = endTime - session.startTime;
        session.elapsedTime = (session.elapsedTime || 0) + elapsed;
      }

      await session.save();
      await session.populate("goalId");

      res.json(session);
    } catch (error) {
      logger.error("Complete timer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get active timer session
  async getActiveTimer(req, res) {
    try {
      const session = await TimerSession.findOne({
        userId: req.userId,
        status: { $in: ["active", "paused"] },
      }).populate("goalId");

      res.json(session);
    } catch (error) {
      logger.error("Get active timer error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get timer history
  async getTimerHistory(req, res) {
    try {
      const { page = 1, limit = 10, type, goalId } = req.query;

      const query = { userId: req.userId };
      if (type) query.type = type;
      if (goalId) query.goalId = goalId;

      const sessions = await TimerSession.find(query)
        .populate("goalId")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await TimerSession.countDocuments(query);

      res.json({
        sessions,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      logger.error("Get timer history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get timer statistics
  async getTimerStats(req, res) {
    try {
      const userId = req.userId;
      const { startDate, endDate } = req.query;

      const matchQuery = { userId };
      if (startDate && endDate) {
        matchQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const stats = await TimerSession.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$type",
            totalSessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
            averageTime: { $avg: "$elapsedTime" },
          },
        },
      ]);

      const totalStats = await TimerSession.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            totalTime: { $sum: "$elapsedTime" },
          },
        },
      ]);

      res.json({
        byType: stats,
        total: totalStats[0] || { totalSessions: 0, totalTime: 0 },
      });
    } catch (error) {
      logger.error("Get timer stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new TimerController();
