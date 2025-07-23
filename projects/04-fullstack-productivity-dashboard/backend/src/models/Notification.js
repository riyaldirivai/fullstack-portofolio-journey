const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "goal_reminder",
      "goal_deadline",
      "goal_completed",
      "timer_completed",
      "achievement_unlocked",
      "weekly_report",
      "system_update",
    ],
    required: [true, "Notification type is required"],
  },
  title: {
    type: String,
    required: [true, "Notification title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  message: {
    type: String,
    required: [true, "Notification message is required"],
    trim: true,
    maxlength: [500, "Message cannot exceed 500 characters"],
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  relatedModel: {
    type: String,
    enum: ["Goal", "TimerSession", "User"],
    default: null,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: false,
    },
    push: {
      type: Boolean,
      default: false,
    },
  },
  status: {
    type: String,
    enum: ["pending", "sent", "delivered", "read", "failed"],
    default: "pending",
  },
  scheduledFor: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
  },
  readAt: {
    type: Date,
  },
  action: {
    type: {
      type: String,
      enum: ["navigate", "external_link", "dismiss"],
      default: "dismiss",
    },
    url: {
      type: String,
      trim: true,
    },
    buttonText: {
      type: String,
      trim: true,
      maxlength: [30, "Button text cannot exceed 30 characters"],
    },
  },
  metadata: {
    deviceType: {
      type: String,
      enum: ["web", "mobile", "desktop"],
    },
    userAgent: String,
    ipAddress: String,
  },
  expiresAt: {
    type: Date,
    default: function () {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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

// Update the updatedAt field before saving
notificationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
notificationSchema.index({ userId: 1, status: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 });

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadForUser = function (userId, limit = 10) {
  return this.find({
    userId,
    status: { $in: ["sent", "delivered"] },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function (userId, notificationIds) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      userId,
    },
    {
      status: "read",
      readAt: new Date(),
    }
  );
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Static method to create goal reminder notification
notificationSchema.statics.createGoalReminder = function (userId, goal) {
  return this.create({
    userId,
    type: "goal_reminder",
    title: "Goal Reminder",
    message: `Don't forget to work on your goal: ${goal.title}`,
    relatedId: goal._id,
    relatedModel: "Goal",
    data: {
      goalId: goal._id,
      goalTitle: goal.title,
      progress: goal.progressPercentage,
    },
    channels: {
      inApp: true,
      push: true,
    },
    action: {
      type: "navigate",
      url: `/goals/${goal._id}`,
      buttonText: "View Goal",
    },
  });
};

// Static method to create achievement notification
notificationSchema.statics.createAchievement = function (userId, achievement) {
  return this.create({
    userId,
    type: "achievement_unlocked",
    title: "Achievement Unlocked!",
    message: `Congratulations! You've earned: ${achievement.name}`,
    priority: "high",
    data: achievement,
    channels: {
      inApp: true,
      push: true,
    },
    action: {
      type: "navigate",
      url: "/achievements",
      buttonText: "View Achievements",
    },
  });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);
