const mongoose = require("mongoose");

const timerSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Goal",
    default: null,
  },
  type: {
    type: String,
    enum: ["pomodoro", "focus", "break", "longbreak"],
    required: [true, "Timer type is required"],
  },
  taskName: {
    type: String,
    trim: true,
    maxlength: [100, "Task name cannot exceed 100 characters"],
  },
  duration: {
    type: Number, // in milliseconds
    required: [true, "Duration is required"],
    min: [60000, "Duration must be at least 1 minute"], // 1 minute minimum
  },
  elapsedTime: {
    type: Number, // in milliseconds
    default: 0,
    min: [0, "Elapsed time cannot be negative"],
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  pausedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["active", "paused", "completed", "cancelled"],
    default: "active",
  },
  interruptions: [
    {
      reason: {
        type: String,
        trim: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      duration: {
        type: Number, // in milliseconds
      },
    },
  ],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, "Notes cannot exceed 500 characters"],
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: [30, "Tag cannot exceed 30 characters"],
    },
  ],
  productivity: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [200, "Feedback cannot exceed 200 characters"],
    },
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    autoStartBreak: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for session duration in minutes
timerSessionSchema.virtual("durationMinutes").get(function () {
  return Math.round(this.duration / 60000);
});

// Virtual for elapsed time in minutes
timerSessionSchema.virtual("elapsedMinutes").get(function () {
  return Math.round(this.elapsedTime / 60000);
});

// Virtual for completion percentage
timerSessionSchema.virtual("completionPercentage").get(function () {
  return Math.min((this.elapsedTime / this.duration) * 100, 100);
});

// Virtual for remaining time
timerSessionSchema.virtual("remainingTime").get(function () {
  return Math.max(this.duration - this.elapsedTime, 0);
});

// Update the updatedAt field before saving
timerSessionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
timerSessionSchema.index({ userId: 1, status: 1 });
timerSessionSchema.index({ userId: 1, type: 1 });
timerSessionSchema.index({ userId: 1, createdAt: -1 });
timerSessionSchema.index({ goalId: 1 });

// Static method to find active session for user
timerSessionSchema.statics.findActiveSession = function (userId) {
  return this.findOne({
    userId,
    status: { $in: ["active", "paused"] },
  }).populate("goalId");
};

// Static method to get user's timer statistics
timerSessionSchema.statics.getUserStats = function (
  userId,
  startDate,
  endDate
) {
  const matchQuery = { userId, status: "completed" };

  if (startDate && endDate) {
    matchQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$type",
        totalSessions: { $sum: 1 },
        totalTime: { $sum: "$elapsedTime" },
        averageTime: { $avg: "$elapsedTime" },
        averageRating: { $avg: "$productivity.rating" },
      },
    },
  ]);
};

// Instance method to add interruption
timerSessionSchema.methods.addInterruption = function (reason, duration) {
  this.interruptions.push({
    reason,
    duration,
    timestamp: new Date(),
  });
  return this.save();
};

// Instance method to calculate actual focus time (excluding interruptions)
timerSessionSchema.methods.getFocusTime = function () {
  const totalInterruptionTime = this.interruptions.reduce(
    (total, interruption) => total + (interruption.duration || 0),
    0
  );
  return Math.max(this.elapsedTime - totalInterruptionTime, 0);
};

module.exports = mongoose.model("TimerSession", timerSessionSchema);
