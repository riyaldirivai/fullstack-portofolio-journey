/**
 * Logger Configuration using Winston
 * Handles application logging with file rotation and console output
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotate file transport
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '5242880', // 5MB
  maxFiles: process.env.LOG_MAX_FILES || '5', // Keep 5 files
  zippedArchive: true,
  format: logFormat
});

// Error file transport
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: process.env.LOG_MAX_SIZE || '5242880', // 5MB
  maxFiles: process.env.LOG_MAX_FILES || '5', // Keep 5 files
  zippedArchive: true,
  format: logFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: process.env.APP_NAME || 'productivity-dashboard-api',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    fileRotateTransport,
    errorFileTransport
  ],
  exitOnError: false
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: process.env.DEBUG_MODE === 'true' ? 'debug' : 'info'
  }));
}

// Handle logging errors
fileRotateTransport.on('error', (error) => {
  console.error('File transport error:', error);
});

errorFileTransport.on('error', (error) => {
  console.error('Error file transport error:', error);
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Helper methods
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    responseTime: `${responseTime}ms`,
    statusCode: res.statusCode,
    contentLength: res.get('Content-Length') || 0
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request:', logData);
  } else {
    logger.info('HTTP Request:', logData);
  }
};

logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };

  if (req) {
    errorData.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      body: process.env.ENABLE_ERROR_STACK_TRACE === 'true' ? req.body : '[REDACTED]'
    };
  }

  logger.error('Application Error:', errorData);
};

// Export logger
module.exports = logger;
