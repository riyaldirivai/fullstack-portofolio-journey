/**
 * TimerSession Model
 * Handles timer session data structure and pomodoro functionality
 */

const mongoose = require('mongoose');
const moment = require('moment');

const timerSessionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },

  // Goal Reference (optional)
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null
  },

  // Timer Information
  type: {
    type: String,
    enum: {
      values: ['pomodoro', 'focus', 'break', 'custom'],
      message: 'Type must be one of: pomodoro, focus, break, custom'
    },
    required: [true, 'Timer type is required'],
    default: 'pomodoro'
  },

  // Session Title/Name
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    default: function() {
      return this.type === 'pomodoro' ? 'Focus Session' : 
             this.type === 'focus' ? 'Deep Focus' :
             this.type === 'break' ? 'Break' : 'Timer Session';
    }
  },

  // Time Tracking
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },

  endTime: {
    type: Date,
    default: null
  },

  // Planned duration in minutes
  plannedDuration: {
    type: Number,
    required: [true, 'Planned duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [480, 'Duration cannot exceed 8 hours'],
    default: function() {
      return this.type === 'pomodoro' ? 25 :
             this.type === 'focus' ? 50 :
             this.type === 'break' ? 5 : 25;
    }
  },

  // Actual duration in minutes (calculated when session ends)
  actualDuration: {
    type: Number,
    default: 0,
    min: [0, 'Actual duration cannot be negative']
  },

  // Session Status
  status: {
    type: String,
    enum: {
      values: ['running', 'paused', 'completed', 'cancelled', 'expired'],
      message: 'Status must be one of: running, paused, completed, cancelled, expired'
    },
    required: [true, 'Status is required'],
    default: 'running'
  },

  // Pause Tracking
  pausedAt: {
    type: Date,
    default: null
  },

  totalPausedTime: {
    type: Number, // in milliseconds
    default: 0
  },

  pauseCount: {
    type: Number,
    default: 0,
    min: [0, 'Pause count cannot be negative']
  },

  // Session Metrics
  completionPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Completion percentage cannot be negative'],
    max: [100, 'Completion percentage cannot exceed 100']
  },
  
  // Productivity rating (1-5)
  productivityRating: {
    type: Number,
    min: [1, 'Productivity rating must be between 1 and 5'],
    max: [5, 'Productivity rating must be between 1 and 5'],
    default: null
  },

  // Notes and Tags
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  },

  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],

  // Device Information
  deviceInfo: {
    platform: String,
    browser: String,
    userAgent: String
  },

  // Session settings
  settings: {
    soundEnabled: {
      type: Boolean,
      default: true
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    autoStartBreak: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
timerSessionSchema.index({ userId: 1, status: 1 });
timerSessionSchema.index({ userId: 1, type: 1 });
timerSessionSchema.index({ userId: 1, createdAt: -1 });
timerSessionSchema.index({ goalId: 1 });

// Virtual for elapsed time (current running time)
timerSessionSchema.virtual('elapsedTime').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return this.actualDuration * 60 * 1000; // return in milliseconds
  }
  
  if (this.status === 'paused') {
    return this.pausedAt ? 
      (this.pausedAt.getTime() - this.startTime.getTime() - this.totalPausedTime) : 0;
  }
  
  if (this.status === 'running') {
    return Date.now() - this.startTime.getTime() - this.totalPausedTime;
  }
  
  return 0;
});

// Virtual for remaining time
timerSessionSchema.virtual('remainingTime').get(function() {
  const plannedMs = this.plannedDuration * 60 * 1000;
  const elapsed = this.elapsedTime;
  return Math.max(0, plannedMs - elapsed);
});

// Virtual for is expired
timerSessionSchema.virtual('isExpired').get(function() {
  return this.remainingTime <= 0 && (this.status === 'running' || this.status === 'paused');
});

// Pre-save middleware
timerSessionSchema.pre('save', function(next) {
  // Calculate actual duration when session is completed
  if (this.status === 'completed' && this.endTime && !this.actualDuration) {
    this.actualDuration = Math.round(
      (this.endTime.getTime() - this.startTime.getTime() - this.totalPausedTime) / (1000 * 60)
    );
    
    // Calculate completion percentage
    this.completionPercentage = Math.min(100, 
      Math.round((this.actualDuration / this.plannedDuration) * 100)
    );
  }
  
  next();
});

// Static method to get active timer for user
timerSessionSchema.statics.getActiveTimer = async function(userId) {
  return await this.findOne({
    userId: userId,
    status: { $in: ['running', 'paused'] }
  }).populate('goalId', 'title category');
};

// Static method to get pomodoro statistics
timerSessionSchema.statics.getPomodoroStats = async function(userId, days = 7) {
  const startDate = moment().subtract(days, 'days').startOf('day').toDate();
  
  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          type: "$type"
        },
        count: { $sum: 1 },
        totalDuration: { $sum: "$actualDuration" },
        avgCompletion: { $avg: "$completionPercentage" }
      }
    },
    {
      $group: {
        _id: "$_id.date",
        sessions: {
          $push: {
            type: "$_id.type",
            count: "$count",
            totalDuration: "$totalDuration",
            avgCompletion: "$avgCompletion"
          }
        },
        totalSessions: { $sum: "$count" },
        totalTime: { $sum: "$totalDuration" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  return stats;
};

// Instance method to pause timer
timerSessionSchema.methods.pause = function() {
  if (this.status !== 'running') {
    throw new Error('Can only pause running timers');
  }
  
  this.status = 'paused';
  this.pausedAt = new Date();
  this.pauseCount += 1;
  
  return this.save();
};

// Instance method to resume timer
timerSessionSchema.methods.resume = function() {
  if (this.status !== 'paused') {
    throw new Error('Can only resume paused timers');
  }
  
  if (this.pausedAt) {
    this.totalPausedTime += Date.now() - this.pausedAt.getTime();
  }
  
  this.status = 'running';
  this.pausedAt = null;
  
  return this.save();
};

// Instance method to complete timer
timerSessionSchema.methods.complete = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error('Timer is already finished');
  }
  
  // If paused, add final pause duration
  if (this.status === 'paused' && this.pausedAt) {
    this.totalPausedTime += Date.now() - this.pausedAt.getTime();
  }
  
  this.status = 'completed';
  this.endTime = new Date();
  this.pausedAt = null;
  
  return this.save();
};

// Instance method to cancel timer
timerSessionSchema.methods.cancel = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    throw new Error('Timer is already finished');
  }
  
  // If paused, add final pause duration
  if (this.status === 'paused' && this.pausedAt) {
    this.totalPausedTime += Date.now() - this.pausedAt.getTime();
  }
  
  this.status = 'cancelled';
  this.endTime = new Date();
  this.pausedAt = null;
  
  // Calculate partial duration
  this.actualDuration = Math.round(
    (Date.now() - this.startTime.getTime() - this.totalPausedTime) / (1000 * 60)
  );
  
  this.completionPercentage = Math.min(100, 
    Math.round((this.actualDuration / this.plannedDuration) * 100)
  );
  
  return this.save();
};

module.exports = mongoose.model('TimerSession', timerSessionSchema);
