/**
 * Global Error Handler Middleware
 * Handles all errors and provides consistent error responses
 */

const logger = require('../config/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));

  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR'
  );
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
  
  return new AppError(message, 409, 'DUPLICATE_ERROR');
};

// Handle Mongoose cast errors
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'CAST_ERROR');
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

// Handle JWT expired errors
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

// Handle MongoDB connection errors
const handleMongoNetworkError = () => {
  return new AppError('Database connection failed. Please try again later.', 503, 'DATABASE_ERROR');
};

// Handle multer file upload errors
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large', 413, 'FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files', 400, 'TOO_MANY_FILES');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }
  return new AppError('File upload error', 400, 'FILE_UPLOAD_ERROR');
};

// Send error response for development
const sendErrorDev = (err, req, res) => {
  // Log error details
  logger.error('Error Details:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
    error: {
      status: err.status,
      statusCode: err.statusCode,
      stack: err.stack,
      isOperational: err.isOperational
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
};

// Send error response for production
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.error('Operational Error:', {
      message: err.message,
      code: err.code,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || 'OPERATIONAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  // Programming or other unknown error: don't leak error details
  logger.error('System Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = handleCastError(error);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error = handleValidationError(error);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = handleDuplicateKeyError(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // MongoDB network errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    error = handleMongoNetworkError();
  }

  // Multer errors
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Handle async errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle 404 - Not Found
const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
};

// Validation error formatter
const formatValidationError = (errors) => {
  return errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    value: error.value,
    location: error.location
  }));
};

// Create error response
const createErrorResponse = (message, statusCode = 500, code = null, details = null) => {
  return {
    success: false,
    message,
    code: code || 'ERROR',
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFound,
  formatValidationError,
  createErrorResponse
};
