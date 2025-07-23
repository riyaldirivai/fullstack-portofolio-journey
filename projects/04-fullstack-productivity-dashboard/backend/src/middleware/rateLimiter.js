const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redisClient = require("../config/redis");
const { logger } = require("../utils/logger");
const { responseHelpers } = require("../utils/helpers");
const { HTTP_STATUS, RATE_LIMIT } = require("../utils/constants");

/**
 * Create rate limiter with Redis store
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: RATE_LIMIT.GENERAL.windowMs,
    max: RATE_LIMIT.GENERAL.max,
    message: RATE_LIMIT.GENERAL.message,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisClient.client
      ? new RedisStore({
          sendCommand: (...args) => redisClient.client.sendCommand(args),
        })
      : undefined,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.userId || req.ip;
    },
    handler: (req, res) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        userId: req.userId || "anonymous",
        endpoint: req.originalUrl,
        method: req.method,
        userAgent: req.get("User-Agent"),
      });

      return responseHelpers.error(
        res,
        options.message || RATE_LIMIT.GENERAL.message,
        HTTP_STATUS.TOO_MANY_REQUESTS
      );
    },
    onLimitReached: (req, res, options) => {
      logger.warn("Rate limit reached", {
        ip: req.ip,
        userId: req.userId || "anonymous",
        endpoint: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs,
      });
    },
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General API rate limiter
 * Applied to all API routes
 */
const generalRateLimit = createRateLimiter({
  windowMs: RATE_LIMIT.GENERAL.windowMs,
  max: RATE_LIMIT.GENERAL.max,
  message: "Too many requests from this IP, please try again later.",
});

/**
 * Authentication rate limiter
 * Applied to login/register endpoints
 */
const authRateLimit = createRateLimiter({
  windowMs: RATE_LIMIT.AUTH.windowMs,
  max: RATE_LIMIT.AUTH.max,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: (req) => {
    // Use email + IP for auth endpoints
    const email = req.body.email || "";
    return `${req.ip}:${email}`;
  },
});

/**
 * Strict rate limiter for sensitive operations
 * Applied to password reset, account deletion, etc.
 */
const strictRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: "Too many sensitive operation attempts, please try again later.",
  keyGenerator: (req) => {
    // Use user ID for authenticated requests, IP for others
    return req.userId || req.ip;
  },
});

/**
 * API rate limiter for external integrations
 * More permissive for authenticated API calls
 */
const apiRateLimit = createRateLimiter({
  windowMs: RATE_LIMIT.API.windowMs,
  max: RATE_LIMIT.API.max,
  message: "API rate limit exceeded, please slow down.",
  keyGenerator: (req) => {
    // Use API key or user ID for API endpoints
    return req.headers["x-api-key"] || req.userId || req.ip;
  },
});

/**
 * File upload rate limiter
 * Limits file upload attempts
 */
const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes
  message: "Too many file uploads, please try again later.",
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
});

/**
 * Search rate limiter
 * Limits search requests to prevent abuse
 */
const searchRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: "Too many search requests, please slow down.",
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
});

/**
 * Password reset rate limiter
 * Very strict limits for password reset requests
 */
const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: "Too many password reset attempts, please try again later.",
  keyGenerator: (req) => {
    // Use email for password reset
    return req.body.email || req.ip;
  },
});

/**
 * Registration rate limiter
 * Limits new account creation
 */
const registrationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message:
    "Too many registration attempts from this IP, please try again later.",
  keyGenerator: (req) => req.ip,
});

/**
 * Timer operation rate limiter
 * Limits timer start/stop operations
 */
const timerRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 timer operations per minute
  message: "Too many timer operations, please slow down.",
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
});

/**
 * Goal operation rate limiter
 * Limits goal creation/updates
 */
const goalRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 goal operations per 5 minutes
  message: "Too many goal operations, please slow down.",
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
});

/**
 * Dynamic rate limiter based on user tier/plan
 * Can be used for premium features
 */
const dynamicRateLimit = (req, res, next) => {
  // Default limits
  let windowMs = 15 * 60 * 1000; // 15 minutes
  let max = 100;

  // Adjust limits based on user plan (if implemented)
  if (req.user) {
    const userPlan = req.user.plan || "free";

    switch (userPlan) {
      case "premium":
        max = 500;
        break;
      case "pro":
        max = 1000;
        break;
      case "enterprise":
        max = 5000;
        break;
      default:
        max = 100;
    }
  }

  const limiter = createRateLimiter({
    windowMs,
    max,
    message: `Rate limit exceeded for your plan. Upgrade for higher limits.`,
  });

  return limiter(req, res, next);
};

/**
 * IP-based rate limiter with whitelist
 * Allows certain IPs to bypass rate limiting
 */
const ipRateLimit = (whitelist = []) => {
  return (req, res, next) => {
    // Check if IP is whitelisted
    if (whitelist.includes(req.ip)) {
      return next();
    }

    // Apply general rate limiting
    return generalRateLimit(req, res, next);
  };
};

/**
 * Adaptive rate limiter
 * Adjusts limits based on system load or time of day
 */
const adaptiveRateLimit = (req, res, next) => {
  const hour = new Date().getHours();
  let max = 100;

  // Reduce limits during peak hours (9 AM - 6 PM)
  if (hour >= 9 && hour <= 18) {
    max = 50;
  }

  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max,
    message: "Service is experiencing high load, please try again later.",
  });

  return limiter(req, res, next);
};

/**
 * Custom rate limiter for specific endpoints
 */
const customRateLimit = (options) => {
  return createRateLimiter(options);
};

module.exports = {
  // Pre-configured rate limiters
  generalRateLimit,
  authRateLimit,
  strictRateLimit,
  apiRateLimit,
  uploadRateLimit,
  searchRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  timerRateLimit,
  goalRateLimit,

  // Dynamic rate limiters
  dynamicRateLimit,
  ipRateLimit,
  adaptiveRateLimit,

  // Custom rate limiter factory
  customRateLimit,
  createRateLimiter,
};
