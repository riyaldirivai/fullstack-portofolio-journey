/**
 * Timer Model
 * Handles timer sessions for productivity tracking
 */

const mongoose = require('mongoose');

const timerSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Goal Reference (optional)
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },

  // Timer Configuration
  type: {
    type: String,
    enum: {
      values: ['pomodoro', 'focus', 'break', 'custom'],
      message: 'Timer type must be one of: pomodoro, focus, break, custom'
    },
    required: [true, 'Timer type is required']
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Timer name cannot exceed 100 characters'],
    default: 'Untitled Session'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Timer description cannot exceed 300 characters']
  },

  // Time Settings
  plannedDuration: {
    type: Number, // in minutes
    required: [true, 'Planned duration is required'],
    min: [1, 'Planned duration must be at least 1 minute'],
    max: [480, 'Planned duration cannot exceed 8 hours'] // 8 hours max
  },
  actualDuration: {
    type: Number, // in minutes
    default: 0
  },

  // Session Timing
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    default: null
  },
  pausedAt: {
    type: Date,
    default: null
  },
  resumedAt: {
    type: Date,
    default: null
  },

  // Timer Status
  status: {
    type: String,
    enum: {
      values: ['running', 'paused', 'completed', 'cancelled', 'expired'],
      message: 'Status must be one of: running, paused, completed, cancelled, expired'
    },
    default: 'running'
  },

  // Pause/Resume History
  pauseHistory: [{
    pausedAt: { type: Date, required: true },
    resumedAt: { type: Date },
    reason: { 
      type: String, 
      maxlength: 100,
      default: 'Manual pause'
    },
    duration: { type: Number } // pause duration in minutes
  }],

  // Productivity Metrics
  focusScore: {
    type: Number,
    min: [1, 'Focus score must be between 1 and 10'],
    max: [10, 'Focus score must be between 1 and 10'],
    default: null
  },
  productivityRating: {
    type: Number,
    min: [1, 'Productivity rating must be between 1 and 5'],
    max: [5, 'Productivity rating must be between 1 and 5'],
    default: null
  },
  energyLevel: {
    type: Number,
    min: [1, 'Energy level must be between 1 and 5'],
    max: [5, 'Energy level must be between 1 and 5'],
    default: null
  },

  // Pomodoro Specific
  pomodoroRound: {
    type: Number,
    default: 1,
    min: [1, 'Pomodoro round must be at least 1']
  },
  isBreakTimer: {
    type: Boolean,
    default: false
  },

  // Session Notes and Tags
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  // Interruptions and Distractions
  interruptions: [{
    type: {
      type: String,
      enum: ['phone', 'email', 'person', 'notification', 'other'],
      required: true
    },
    description: { type: String, maxlength: 100 },
    duration: { type: Number }, // in seconds
    timestamp: { type: Date, default: Date.now }
  }],
  distractionCount: {
    type: Number,
    default: 0
  },

  // Completion Details
  completedEarly: {
    type: Boolean,
    default: false
  },
  completionReason: {
    type: String,
    enum: ['finished', 'goal_completed', 'interrupted', 'cancelled', 'break_needed'],
    default: 'finished'
  },

  // Environment and Context
  environment: {
    location: { type: String, maxlength: 50 },
    noiseLevel: { 
      type: String, 
      enum: ['silent', 'quiet', 'moderate', 'noisy'],
      default: 'quiet'
    },
    backgroundMusic: { type: Boolean, default: false },
    musicType: { type: String, maxlength: 50 }
  },

  // Device and Platform Info
  deviceInfo: {
    platform: String,
    browser: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
timerSchema.index({ userId: 1, createdAt: -1 });
timerSchema.index({ userId: 1, status: 1 });
timerSchema.index({ goalId: 1 });
timerSchema.index({ type: 1 });
timerSchema.index({ startTime: 1 });
timerSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Virtual for total pause time
timerSchema.virtual('totalPauseTime').get(function() {
  return this.pauseHistory.reduce((total, pause) => {
    return total + (pause.duration || 0);
  }, 0);
});

// Virtual for effective duration (actual time minus pauses)
timerSchema.virtual('effectiveDuration').get(function() {
  return Math.max(0, this.actualDuration - this.totalPauseTime);
});

// Virtual for completion percentage
timerSchema.virtual('completionPercentage').get(function() {
  if (this.plannedDuration === 0) return 0;
  return Math.min(100, Math.round((this.actualDuration / this.plannedDuration) * 100));
});

// Virtual for is overdue
timerSchema.virtual('isOverdue').get(function() {
  if (!this.startTime || this.status !== 'running') return false;
  const expectedEndTime = new Date(this.startTime.getTime() + (this.plannedDuration * 60 * 1000));
  return new Date() > expectedEndTime;
});

// Virtual for remaining time
timerSchema.virtual('remainingTime').get(function() {
  if (this.status !== 'running') return 0;
  const elapsed = Math.floor((new Date() - this.startTime) / (1000 * 60)); // in minutes
  return Math.max(0, this.plannedDuration - elapsed);
});

// Pre-save middleware
timerSchema.pre('save', function(next) {
  // Calculate actual duration if timer is completed
  if (this.status === 'completed' && this.startTime && this.endTime) {
    this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }

  // Update pause duration in pause history
  this.pauseHistory.forEach(pause => {
    if (pause.pausedAt && pause.resumedAt && !pause.duration) {
      pause.duration = Math.round((pause.resumedAt - pause.pausedAt) / (1000 * 60)); // in minutes
    }
  });

  // Auto-expire overdue running timers
  if (this.status === 'running' && this.isOverdue) {
    this.status = 'expired';
    this.endTime = new Date();
  }

  next();
});

// Instance method to pause timer
timerSchema.methods.pauseTimer = function(reason = 'Manual pause') {
  if (this.status !== 'running') {
    throw new Error('Can only pause running timers');
  }

  this.status = 'paused';
  this.pausedAt = new Date();
  
  this.pauseHistory.push({
    pausedAt: this.pausedAt,
    reason
  });
};

// Instance method to resume timer
timerSchema.methods.resumeTimer = function() {
  if (this.status !== 'paused') {
    throw new Error('Can only resume paused timers');
  }

  this.status = 'running';
  this.resumedAt = new Date();
  
  // Update the last pause entry
  const lastPause = this.pauseHistory[this.pauseHistory.length - 1];
  if (lastPause && !lastPause.resumedAt) {
    lastPause.resumedAt = this.resumedAt;
    lastPause.duration = Math.round((this.resumedAt - lastPause.pausedAt) / (1000 * 60));
  }

  this.pausedAt = null;
};

// Instance method to complete timer
timerSchema.methods.completeTimer = function(reason = 'finished') {
  this.status = 'completed';
  this.endTime = new Date();
  this.completionReason = reason;
  
  // Calculate if completed early
  const elapsed = Math.round((this.endTime - this.startTime) / (1000 * 60));
  this.completedEarly = elapsed < this.plannedDuration;
  this.actualDuration = elapsed;
};

// Instance method to cancel timer
timerSchema.methods.cancelTimer = function(reason = 'cancelled') {
  this.status = 'cancelled';
  this.endTime = new Date();
  this.completionReason = reason;
  this.actualDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
};

// Instance method to add interruption
timerSchema.methods.addInterruption = function(type, description = '', duration = 0) {
  this.interruptions.push({
    type,
    description,
    duration,
    timestamp: new Date()
  });
  this.distractionCount += 1;
};

// Instance method to rate session
timerSchema.methods.rateSession = function(focusScore, productivityRating, energyLevel) {
  this.focusScore = focusScore;
  this.productivityRating = productivityRating;
  this.energyLevel = energyLevel;
};

// Static method to find by user and date range
timerSchema.statics.findByUserAndDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    startTime: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ startTime: -1 });
};

// Static method to find by goal
timerSchema.statics.findByGoal = function(goalId) {
  return this.find({ goalId }).sort({ startTime: -1 });
};

// Static method to get user timer statistics
timerSchema.statics.getUserTimerStats = async function(userId, dateRange = {}) {
  const matchQuery = { userId: mongoose.Types.ObjectId.createFromHexString(userId) };
  
  if (dateRange.start && dateRange.end) {
    matchQuery.startTime = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalPlannedTime: { $sum: '$plannedDuration' },
        totalActualTime: { $sum: '$actualDuration' },
        avgFocusScore: { $avg: '$focusScore' },
        avgProductivityRating: { $avg: '$productivityRating' },
        avgEnergyLevel: { $avg: '$energyLevel' },
        totalInterruptions: { $sum: '$distractionCount' }
      }
    }
  ]);

  return stats[0] || {
    totalSessions: 0,
    completedSessions: 0,
    totalPlannedTime: 0,
    totalActualTime: 0,
    avgFocusScore: 0,
    avgProductivityRating: 0,
    avgEnergyLevel: 0,
    totalInterruptions: 0
  };
};

// Static method to get daily productivity stats
timerSchema.statics.getDailyStats = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.getUserTimerStats(userId, {
    start: startOfDay,
    end: endOfDay
  });
};

module.exports = mongoose.model('Timer', timerSchema);
