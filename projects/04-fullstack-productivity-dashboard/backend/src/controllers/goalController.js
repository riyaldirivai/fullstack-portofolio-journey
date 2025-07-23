const Goal = require("../models/Goal");
const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

class GoalController {
  // Get all goals for user
  async getGoals(req, res) {
    try {
      const goals = await Goal.find({ userId: req.userId })
        .populate("category")
        .sort({ createdAt: -1 });

      res.json(goals);
    } catch (error) {
      logger.error("Get goals error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get single goal
  async getGoal(req, res) {
    try {
      const goal = await Goal.findOne({
        _id: req.params.id,
        userId: req.userId,
      }).populate("category");

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json(goal);
    } catch (error) {
      logger.error("Get goal error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Create new goal
  async createGoal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        description,
        category,
        targetValue,
        currentValue = 0,
        unit,
        deadline,
        priority,
      } = req.body;

      const goal = new Goal({
        title,
        description,
        category,
        targetValue,
        currentValue,
        unit,
        deadline,
        priority,
        userId: req.userId,
      });

      await goal.save();
      await goal.populate("category");

      res.status(201).json(goal);
    } catch (error) {
      logger.error("Create goal error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update goal
  async updateGoal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true, runValidators: true }
      ).populate("category");

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json(goal);
    } catch (error) {
      logger.error("Update goal error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Delete goal
  async deleteGoal(req, res) {
    try {
      const goal = await Goal.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json({ message: "Goal deleted successfully" });
    } catch (error) {
      logger.error("Delete goal error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Update goal progress
  async updateProgress(req, res) {
    try {
      const { currentValue } = req.body;

      const goal = await Goal.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        {
          currentValue,
          updatedAt: Date.now(),
        },
        { new: true, runValidators: true }
      ).populate("category");

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      // Check if goal is completed
      if (
        goal.currentValue >= goal.targetValue &&
        goal.status !== "completed"
      ) {
        goal.status = "completed";
        goal.completedAt = new Date();
        await goal.save();
      }

      res.json(goal);
    } catch (error) {
      logger.error("Update progress error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }

  // Get goal statistics
  async getGoalStats(req, res) {
    try {
      const userId = req.userId;

      const stats = await Goal.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalGoals = await Goal.countDocuments({ userId });

      res.json({
        totalGoals,
        stats,
      });
    } catch (error) {
      logger.error("Get goal stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = new GoalController();
