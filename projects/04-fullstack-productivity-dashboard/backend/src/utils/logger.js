const winston = require("winston");
const path = require("path");

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels,
  format: logFormat,
  defaultMeta: { service: "productivity-dashboard" },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/exceptions.log"),
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/rejections.log"),
    }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} ${level}: ${stack || message}`;
        })
      ),
    })
  );
}

// Create HTTP logger middleware using Morgan
const morgan = require("morgan");

// Custom Morgan token for response time with color
morgan.token("response-time-colored", (req, res) => {
  const responseTime = parseFloat(morgan["response-time"](req, res));
  const color =
    responseTime > 1000
      ? "\x1b[31m"
      : responseTime > 500
      ? "\x1b[33m"
      : "\x1b[32m";
  return `${color}${responseTime}ms\x1b[0m`;
});

// Create Morgan middleware
const httpLogger = morgan(
  ":method :url :status :res[content-length] - :response-time-colored",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }
);

// Utility functions for structured logging
const loggerUtils = {
  // Log API requests
  logRequest: (req, message = "API Request") => {
    logger.info(message, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      userId: req.userId || "anonymous",
    });
  },

  // Log API responses
  logResponse: (req, res, message = "API Response") => {
    logger.info(message, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      userId: req.userId || "anonymous",
    });
  },

  // Log database operations
  logDatabase: (operation, collection, query = {}, result = {}) => {
    logger.debug("Database Operation", {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: Array.isArray(result) ? result.length : 1,
    });
  },

  // Log authentication events
  logAuth: (event, userId, details = {}) => {
    logger.info("Authentication Event", {
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  // Log errors with context
  logError: (error, context = {}) => {
    logger.error("Application Error", {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  // Log performance metrics
  logPerformance: (operation, duration, details = {}) => {
    logger.info("Performance Metric", {
      operation,
      duration: `${duration}ms`,
      ...details,
    });
  },
};

module.exports = {
  logger,
  httpLogger,
  ...loggerUtils,
};
