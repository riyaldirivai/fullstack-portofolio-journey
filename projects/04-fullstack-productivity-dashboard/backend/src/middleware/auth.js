const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logger } = require("../utils/logger");
const { responseHelpers } = require("../utils/helpers");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../utils/constants");

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user information to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.ACCESS_DENIED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isActive) {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Add user info to request
    req.userId = decoded.userId;
    req.user = user;

    // Log successful authentication
    logger.debug("User authenticated successfully", {
      userId: decoded.userId,
      email: user.email,
      endpoint: req.originalUrl,
    });

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.TOKEN_EXPIRED,
        HTTP_STATUS.UNAUTHORIZED
      );
    } else if (error.name === "JsonWebTokenError") {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.TOKEN_INVALID,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    logger.error("Authentication error:", error);
    return responseHelpers.error(
      res,
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Optional Authentication Middleware
 * Adds user information if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (user && user.isActive) {
        req.userId = decoded.userId;
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    logger.debug("Optional authentication failed:", error.message);
    next();
  }
};

/**
 * Role-based Authorization Middleware
 * Currently using user roles (can be extended)
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.ACCESS_DENIED,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // For now, we'll use a simple admin check
    // This can be extended with more complex role systems
    const userRole = req.user.role || "user";

    if (!roles.includes(userRole)) {
      return responseHelpers.error(
        res,
        "Insufficient permissions",
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  };
};

/**
 * Resource Ownership Middleware
 * Ensures user can only access their own resources
 */
const requireOwnership = (Model, paramName = "id") => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return responseHelpers.error(
          res,
          "Resource not found",
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Check if user owns the resource
      if (resource.userId.toString() !== req.userId.toString()) {
        return responseHelpers.error(
          res,
          ERROR_MESSAGES.ACCESS_DENIED,
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Add resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      logger.error("Ownership check error:", error);
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
};

/**
 * API Key Authentication Middleware
 * For external API access (optional)
 */
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return responseHelpers.error(
      res,
      "API key required",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Validate API key (implement your own logic)
  const validApiKeys = process.env.VALID_API_KEYS?.split(",") || [];

  if (!validApiKeys.includes(apiKey)) {
    return responseHelpers.error(
      res,
      "Invalid API key",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  next();
};

/**
 * User Account Status Middleware
 * Checks if user account is active and not suspended
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return responseHelpers.error(
      res,
      ERROR_MESSAGES.ACCESS_DENIED,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (!req.user.isActive) {
    return responseHelpers.error(
      res,
      "Account is deactivated",
      HTTP_STATUS.FORBIDDEN
    );
  }

  // Check for account suspension (if implemented)
  if (req.user.suspendedUntil && req.user.suspendedUntil > new Date()) {
    return responseHelpers.error(
      res,
      "Account is temporarily suspended",
      HTTP_STATUS.FORBIDDEN
    );
  }

  next();
};

/**
 * Refresh Token Validation Middleware
 * For token refresh endpoints
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return responseHelpers.error(
        res,
        "Refresh token required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if user exists
    const user = await User.findById(decoded.userId).select("-password");
    if (!user || !user.isActive) {
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.USER_NOT_FOUND,
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return responseHelpers.error(
        res,
        "Refresh token expired",
        HTTP_STATUS.UNAUTHORIZED
      );
    } else if (error.name === "JsonWebTokenError") {
      return responseHelpers.error(
        res,
        "Invalid refresh token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    logger.error("Refresh token validation error:", error);
    return responseHelpers.error(
      res,
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Update Last Login Middleware
 * Updates user's last login timestamp
 */
const updateLastLogin = async (req, res, next) => {
  try {
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, {
        lastLoginAt: new Date(),
      });
    }
    next();
  } catch (error) {
    // Don't fail the request if this update fails
    logger.error("Failed to update last login:", error);
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  authenticateApiKey,
  requireActiveAccount,
  validateRefreshToken,
  updateLastLogin,
};
