const { logger } = require("../utils/logger");
const { responseHelpers } = require("../utils/helpers");
const {
  HTTP_STATUS,
  ERROR_MESSAGES,
  ENVIRONMENT,
} = require("../utils/constants");

/**
 * Global Error Handler Middleware
 * Centralized error handling for the application
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
  let details = null;

  // Log the error
  logger.error("Application Error", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.userId || "anonymous",
    userAgent: req.get("User-Agent"),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle specific error types
  if (error.name === "ValidationError") {
    // Mongoose validation error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Validation Error";
    details = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  } else if (error.name === "CastError") {
    // Mongoose cast error (invalid ObjectId)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid ID format";
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = HTTP_STATUS.CONFLICT;
    message = "Duplicate field value";
    const field = Object.keys(error.keyValue)[0];
    details = {
      field,
      value: error.keyValue[field],
      message: `${field} already exists`,
    };
  } else if (error.name === "JsonWebTokenError") {
    // JWT error
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.TOKEN_INVALID;
  } else if (error.name === "TokenExpiredError") {
    // JWT expired error
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = ERROR_MESSAGES.TOKEN_EXPIRED;
  } else if (error.name === "MongoNetworkError") {
    // Database connection error
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;
    message = ERROR_MESSAGES.DATABASE_ERROR;
  } else if (error.name === "MulterError") {
    // File upload error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File size too large";
    } else if (error.code === "LIMIT_FILE_COUNT") {
      message = "Too many files";
    } else {
      message = "File upload error";
    }
  } else if (error.type === "entity.parse.failed") {
    // JSON parse error
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid JSON format";
  } else if (error.type === "entity.too.large") {
    // Request entity too large
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Request payload too large";
  }

  // Handle custom application errors
  if (error.isOperational) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId(),
  };

  // Add details in development/testing environment
  if (process.env.NODE_ENV !== ENVIRONMENT.PRODUCTION) {
    errorResponse.error = {
      name: error.name,
      stack: error.stack,
      details,
    };
  } else if (details) {
    errorResponse.details = details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Handles requests to non-existent routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = HTTP_STATUS.NOT_FOUND;

  logger.warn("Route not found", {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  next(error);
};

/**
 * Async Error Handler
 * Wraps async functions to catch errors
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom Application Error Class
 * For creating operational errors
 */
class AppError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = "AppError";

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database Error Handler
 * Handles database-specific errors
 */
const handleDatabaseError = (error) => {
  if (error.name === "MongoNetworkError") {
    return new AppError(
      ERROR_MESSAGES.DATABASE_ERROR,
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (error.name === "MongoTimeoutError") {
    return new AppError(
      "Database operation timed out",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new AppError(`${field} already exists`, HTTP_STATUS.CONFLICT);
  }

  return error;
};

/**
 * Validation Error Handler
 * Formats validation errors consistently
 */
const handleValidationError = (error) => {
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    const appError = new AppError("Validation Error", HTTP_STATUS.BAD_REQUEST);
    appError.details = errors;
    return appError;
  }

  return error;
};

/**
 * Authentication Error Handler
 * Handles auth-specific errors
 */
const handleAuthError = (error) => {
  if (error.name === "JsonWebTokenError") {
    return new AppError(ERROR_MESSAGES.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
  }

  if (error.name === "TokenExpiredError") {
    return new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
  }

  return error;
};

/**
 * Rate Limit Error Handler
 * Handles rate limiting errors
 */
const handleRateLimitError = (req, res, next) => {
  const error = new AppError(
    ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
    HTTP_STATUS.TOO_MANY_REQUESTS
  );

  next(error);
};

/**
 * Request Timeout Handler
 * Handles request timeout
 */
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      const error = new AppError(
        "Request timeout",
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
      next(error);
    }, timeout);

    res.on("finish", () => {
      clearTimeout(timer);
    });

    res.on("close", () => {
      clearTimeout(timer);
    });

    next();
  };
};

/**
 * Error Recovery Middleware
 * Attempts to recover from certain errors
 */
const errorRecovery = (error, req, res, next) => {
  // Attempt database reconnection for connection errors
  if (error.name === "MongoNetworkError") {
    logger.info("Attempting database reconnection...");
    // Trigger reconnection logic here
  }

  // Continue with normal error handling
  next(error);
};

/**
 * Security Error Handler
 * Handles security-related errors
 */
const handleSecurityError = (error, req, res, next) => {
  // Log security incidents
  if (
    error.name === "UnauthorizedError" ||
    error.statusCode === HTTP_STATUS.UNAUTHORIZED
  ) {
    logger.warn("Security incident detected", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      url: req.originalUrl,
      method: req.method,
      error: error.message,
    });
  }

  next(error);
};

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Error Notification Service
 * Sends notifications for critical errors
 */
const notifyError = (error, req) => {
  // Only notify for critical errors in production
  if (
    process.env.NODE_ENV === ENVIRONMENT.PRODUCTION &&
    error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    // Implement error notification logic here
    // e.g., send to Slack, email, monitoring service
    logger.error("Critical error notification", {
      message: error.message,
      stack: error.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.userId,
    });
  }
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  AppError,
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleRateLimitError,
  timeoutHandler,
  errorRecovery,
  handleSecurityError,
};
