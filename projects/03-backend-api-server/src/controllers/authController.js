/**
 * Authentication Controller
 * Handles user registration, login, logout, and token management
 */

const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Register a new user
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName
  });

  // Generate tokens
  const authToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken(req.get('User-Agent'));

  // Save user with refresh token
  await user.save();

  // Log registration
  logger.info(`New user registered: ${email}`);

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        preferences: user.preferences,
        stats: user.stats,
        createdAt: user.createdAt
      },
      tokens: {
        authToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await User.findByEmail(email).select('+password');
  
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account has been deactivated', 401, 'ACCOUNT_DEACTIVATED');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const authToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken(req.get('User-Agent'));

  // Update login info
  user.updateLoginInfo(req.get('User-Agent'));
  await user.save();

  // Log login
  logger.info(`User logged in: ${email} from IP: ${req.ip}`);

  // Remove password from response
  user.password = undefined;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        preferences: user.preferences,
        stats: user.stats,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      },
      tokens: {
        authToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    }
  });
});

// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;
  const oldRefreshToken = req.refreshToken;

  // Remove old refresh token
  user.removeRefreshToken(oldRefreshToken);

  // Generate new tokens
  const newAuthToken = user.generateAuthToken();
  const newRefreshToken = user.generateRefreshToken(req.get('User-Agent'));

  await user.save();

  logger.info(`Token refreshed for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        authToken: newAuthToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const user = req.user;
  const token = req.token;

  // If refresh token is provided in body, remove it
  if (req.body.refreshToken) {
    user.removeRefreshToken(req.body.refreshToken);
  }

  await user.save();

  logger.info(`User logged out: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Logout from all devices
const logoutAll = asyncHandler(async (req, res) => {
  const user = req.user;

  // Clear all refresh tokens
  user.refreshTokens = [];
  await user.save();

  logger.info(`User logged out from all devices: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        avatar: user.avatar,
        timezone: user.timezone,
        preferences: user.preferences,
        stats: user.stats,
        completionRate: user.completionRate,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  });
});

// Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const updates = req.body;

  // List of allowed updates
  const allowedUpdates = [
    'firstName', 
    'lastName', 
    'avatar', 
    'timezone', 
    'preferences'
  ];

  // Filter out non-allowed updates
  const filteredUpdates = {};
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      filteredUpdates[key] = updates[key];
    }
  });

  // Update user
  Object.assign(user, filteredUpdates);
  await user.save();

  logger.info(`Profile updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        timezone: user.timezone,
        preferences: user.preferences,
        updatedAt: user.updatedAt
      }
    }
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Clear all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.'
  });
});

// Delete account
const deleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  const { password } = req.body;

  // Verify password before deletion
  const userWithPassword = await User.findById(user._id).select('+password');
  const isPasswordValid = await userWithPassword.comparePassword(password);
  
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 400, 'INVALID_PASSWORD');
  }

  // Soft delete - deactivate account
  user.isActive = false;
  user.refreshTokens = [];
  await user.save();

  logger.warn(`Account deactivated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Account has been deactivated successfully'
  });
});

// Get user statistics
const getStats = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get additional stats from related models
  const Goal = require('../models/Goal');
  const Timer = require('../models/Timer');

  const [goalStats, timerStats] = await Promise.all([
    Goal.getUserStats(user._id),
    Timer.getUserTimerStats(user._id)
  ]);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        memberSince: user.createdAt,
        lastActive: user.stats.lastActiveDate,
        loginCount: user.loginCount,
        completionRate: user.completionRate
      },
      goals: goalStats,
      timers: timerStats,
      overall: {
        totalTimeTracked: user.stats.totalTimeTracked,
        currentStreak: user.stats.currentStreak,
        longestStreak: user.stats.longestStreak,
        productivityScore: Math.round(
          ((goalStats.completedGoals / Math.max(goalStats.totalGoals, 1)) * 0.6 +
           (timerStats.completedSessions / Math.max(timerStats.totalSessions, 1)) * 0.4) * 100
        )
      }
    }
  });
});

// Verify account (placeholder for email verification)
const verifyAccount = asyncHandler(async (req, res) => {
  const { token } = req.params;

  // This would normally verify an email verification token
  // For now, we'll just return a placeholder response
  
  res.status(200).json({
    success: true,
    message: 'Account verification endpoint - implementation pending'
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getStats,
  verifyAccount
};
