/**
 * Authentication Routes
 * Handles all authentication-related endpoints
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
const { authenticate, verifyRefreshToken, authRateLimit } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');

// Rate limiting for auth endpoints
const strictAuthLimit = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for successful requests
    return res.statusCode < 400;
  }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  strictAuthLimit,
  userValidation.register,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  strictAuthLimit,
  userValidation.login,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  verifyRefreshToken,
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout user from all devices
 * @access  Private
 */
router.post('/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  userValidation.updateProfile,
  authController.updateProfile
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password',
  authenticate,
  userValidation.changePassword,
  authController.changePassword
);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/account',
  authenticate,
  authController.deleteAccount
);

/**
 * @route   GET /api/v1/auth/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats',
  authenticate,
  authController.getStats
);

/**
 * @route   GET /api/v1/auth/verify/:token
 * @desc    Verify user account (email verification)
 * @access  Public
 */
router.get('/verify/:token',
  authController.verifyAccount
);

module.exports = router;
