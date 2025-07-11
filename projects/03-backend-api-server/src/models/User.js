/**
 * User Model
 * Handles user data structure and authentication methods
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  timezone: {
    type: String,
    default: process.env.DEFAULT_TIMEZONE || 'UTC'
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      goals: { type: Boolean, default: true },
      timers: { type: Boolean, default: true }
    },
    productivity: {
      defaultTimerDuration: { type: Number, default: 25 }, // minutes
      breakDuration: { type: Number, default: 5 }, // minutes
      longBreakDuration: { type: Number, default: 15 }, // minutes
      workingHoursStart: { type: String, default: '09:00' },
      workingHoursEnd: { type: String, default: '17:00' }
    }
  },

  // Authentication & Security
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
    deviceInfo: String
  }],

  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,

  // Statistics
  stats: {
    totalGoalsCreated: { type: Number, default: 0 },
    totalGoalsCompleted: { type: Number, default: 0 },
    totalTimeTracked: { type: Number, default: 0 }, // in minutes
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'refreshTokens.token': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for completion rate
userSchema.virtual('completionRate').get(function() {
  if (this.stats.totalGoalsCreated === 0) return 0;
  return Math.round((this.stats.totalGoalsCompleted / this.stats.totalGoalsCreated) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    
    // Set password changed timestamp
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure JWT is created after password change
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256'
  });
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function(deviceInfo = '') {
  const refreshToken = jwt.sign(
    { userId: this._id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  // Add refresh token to user's refreshTokens array
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  this.refreshTokens.push({
    token: refreshToken,
    expiresAt,
    deviceInfo
  });

  return refreshToken;
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
};

// Instance method to clean expired refresh tokens
userSchema.methods.cleanExpiredRefreshTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(t => t.expiresAt > now);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to update login info
userSchema.methods.updateLoginInfo = function(deviceInfo = '') {
  this.lastLogin = new Date();
  this.loginCount += 1;
  this.cleanExpiredRefreshTokens();
};

// Instance method to update stats
userSchema.methods.updateStats = function(statsUpdate) {
  Object.assign(this.stats, statsUpdate);
  this.stats.lastActiveDate = new Date();
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);
