const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Goal title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetValue: {
    type: Number,
    required: [true, "Target value is required"],
    min: [1, "Target value must be positive"],
  },
  currentValue: {
    type: Number,
    default: 0,
    min: [0, "Current value cannot be negative"],
  },
  unit: {
    type: String,
    required: [true, "Unit is required"],
    trim: true,
    maxlength: [20, "Unit cannot exceed 20 characters"],
  },
  status: {
    type: String,
    enum: ["active", "completed", "paused", "cancelled"],
    default: "active",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  deadline: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value > new Date();
      },
      message: "Deadline must be in the future",
    },
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: [30, "Tag cannot exceed 30 characters"],
    },
  ],
  milestones: [
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      targetValue: {
        type: Number,
        required: true,
      },
      completedAt: {
        type: Date,
      },
      isCompleted: {
        type: Boolean,
        default: false,
      },
    },
  ],
  reminders: [
    {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
        default: "daily",
      },
      time: {
        type: String, // HH:MM format
        default: "09:00",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],
  isPublic: {
    type: Boolean,
    default: false,
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

// Virtual for progress percentage
goalSchema.virtual("progressPercentage").get(function () {
  return Math.min((this.currentValue / this.targetValue) * 100, 100);
});

// Virtual for remaining value
goalSchema.virtual("remainingValue").get(function () {
  return Math.max(this.targetValue - this.currentValue, 0);
});

// Virtual for days remaining
goalSchema.virtual("daysRemaining").get(function () {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const timeDiff = deadline.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Update the updatedAt field before saving
goalSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Auto-complete goal if target is reached
  if (this.currentValue >= this.targetValue && this.status === "active") {
    this.status = "completed";
    this.completedAt = new Date();
  }

  next();
});

// Index for better query performance
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ deadline: 1 });

// Static method to find goals by status
goalSchema.statics.findByStatus = function (userId, status) {
  return this.find({ userId, status }).populate("category");
};

// Static method to find overdue goals
goalSchema.statics.findOverdue = function (userId) {
  return this.find({
    userId,
    status: "active",
    deadline: { $lt: new Date() },
  }).populate("category");
};

// Instance method to update progress
goalSchema.methods.updateProgress = function (value) {
  this.currentValue = Math.min(value, this.targetValue);
  return this.save();
};

module.exports = mongoose.model("Goal", goalSchema);
