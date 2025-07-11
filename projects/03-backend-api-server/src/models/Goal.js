/**
 * Goal Model
 * Handles goal data structure and management methods
 */

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Goal description cannot exceed 500 characters']
  },
  
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Goal Classification
  category: {
    type: String,
    required: [true, 'Goal category is required'],
    enum: {
      values: ['work', 'personal', 'health', 'education', 'finance', 'relationships', 'hobby', 'other'],
      message: 'Category must be one of: work, personal, health, education, finance, relationships, hobby, other'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  // Status and Progress
  status: {
    type: String,
    enum: {
      values: ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'],
      message: 'Status must be one of: not_started, in_progress, completed, paused, cancelled'
    },
    default: 'not_started'
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100'],
    default: 0
  },

  // Time Management
  estimatedDuration: {
    type: Number, // in minutes
    min: [1, 'Estimated duration must be at least 1 minute'],
    default: 60
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },
  deadlineDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date,
    default: null
  },

  // Sub-goals and Dependencies
  subGoals: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Sub-goal title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Sub-goal description cannot exceed 300 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: Date,
      default: null
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Productivity Features
  pomodoroSettings: {
    enabled: { type: Boolean, default: false },
    workDuration: { type: Number, default: 25 }, // minutes
    breakDuration: { type: Number, default: 5 }, // minutes
    longBreakDuration: { type: Number, default: 15 }, // minutes
    longBreakInterval: { type: Number, default: 4 } // after how many pomodoros
  },
  
  // Tracking and Analytics
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  timeSessions: [{
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // in minutes
    notes: { type: String, maxlength: 200 },
    createdAt: { type: Date, default: Date.now }
  }],

  // Motivation and Rewards
  motivationLevel: {
    type: Number,
    min: [1, 'Motivation level must be between 1 and 10'],
    max: [10, 'Motivation level must be between 1 and 10'],
    default: 5
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  
  // Collaboration (if shared)
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { 
      type: String, 
      enum: ['view', 'edit', 'manage'],
      default: 'view'
    },
    sharedAt: { type: Date, default: Date.now }
  }],

  // Notes and Files
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Recurring Goals
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: { type: Number, default: 1 }, // every X days/weeks/months/years
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
    endDate: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, category: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });
goalSchema.index({ deadlineDate: 1 });
goalSchema.index({ priority: 1, status: 1 });
goalSchema.index({ tags: 1 });

// Virtual for completion percentage based on sub-goals
goalSchema.virtual('subGoalCompletionRate').get(function() {
  if (this.subGoals.length === 0) return null;
  const completedSubGoals = this.subGoals.filter(sg => sg.completed).length;
  return Math.round((completedSubGoals / this.subGoals.length) * 100);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  if (!this.deadlineDate) return null;
  const today = new Date();
  const deadline = new Date(this.deadlineDate);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is overdue
goalSchema.virtual('isOverdue').get(function() {
  if (!this.deadlineDate || this.status === 'completed') return false;
  return new Date() > this.deadlineDate;
});

// Virtual for efficiency (actual vs estimated duration)
goalSchema.virtual('efficiency').get(function() {
  if (this.estimatedDuration === 0 || this.actualDuration === 0) return null;
  return Math.round((this.estimatedDuration / this.actualDuration) * 100);
});

// Pre-save middleware
goalSchema.pre('save', function(next) {
  // Auto-update progress based on sub-goals completion
  if (this.subGoals.length > 0) {
    const completedSubGoals = this.subGoals.filter(sg => sg.completed).length;
    this.progress = Math.round((completedSubGoals / this.subGoals.length) * 100);
  }

  // Auto-update status based on progress
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedDate = new Date();
  } else if (this.progress > 0 && this.status === 'not_started') {
    this.status = 'in_progress';
  }

  // Calculate actual duration from time sessions
  if (this.timeSessions.length > 0) {
    this.actualDuration = this.timeSessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
    this.timeSpent = this.actualDuration;
  }

  next();
});

// Instance method to add time session
goalSchema.methods.addTimeSession = function(startTime, endTime, notes = '') {
  const duration = Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)); // in minutes
  
  this.timeSessions.push({
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    duration,
    notes
  });

  this.timeSpent += duration;
  this.actualDuration += duration;
};

// Instance method to mark as completed
goalSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.progress = 100;
  this.completedDate = new Date();
  
  // Mark all sub-goals as completed
  this.subGoals.forEach(sg => {
    if (!sg.completed) {
      sg.completed = true;
      sg.completedDate = new Date();
    }
  });
};

// Instance method to add sub-goal
goalSchema.methods.addSubGoal = function(title, description = '') {
  const order = this.subGoals.length;
  this.subGoals.push({
    title,
    description,
    order,
    completed: false
  });
};

// Instance method to toggle sub-goal completion
goalSchema.methods.toggleSubGoal = function(subGoalId) {
  const subGoal = this.subGoals.id(subGoalId);
  if (subGoal) {
    subGoal.completed = !subGoal.completed;
    subGoal.completedDate = subGoal.completed ? new Date() : null;
  }
};

// Static method to find by user and status
goalSchema.statics.findByUserAndStatus = function(userId, status) {
  return this.find({ userId, status });
};

// Static method to find overdue goals
goalSchema.statics.findOverdueGoals = function(userId) {
  return this.find({
    userId,
    deadlineDate: { $lt: new Date() },
    status: { $in: ['not_started', 'in_progress', 'paused'] }
  });
};

// Static method to find goals by category
goalSchema.statics.findByCategory = function(userId, category) {
  return this.find({ userId, category });
};

// Static method to get user statistics
goalSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        completedGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressGoals: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        totalTimeSpent: { $sum: '$timeSpent' },
        avgProgress: { $avg: '$progress' }
      }
    }
  ]);

  return stats[0] || {
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    totalTimeSpent: 0,
    avgProgress: 0
  };
};

module.exports = mongoose.model('Goal', goalSchema);
