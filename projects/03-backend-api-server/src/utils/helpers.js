/**
 * Helper Utilities
 * Common utility functions used across the application
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure token
 * @param {number} bytes - Number of bytes for the token
 * @returns {string} Secure token
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Hash a string using SHA256
 * @param {string} str - String to hash
 * @returns {string} Hashed string
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Generate a JWT token
 * @param {object} payload - JWT payload
 * @param {string} secret - JWT secret
 * @param {object} options - JWT options
 * @returns {string} JWT token
 */
const generateJWT = (payload, secret = process.env.JWT_SECRET, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRE || '7d',
    algorithm: process.env.JWT_ALGORITHM || 'HS256'
  };
  
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret
 * @returns {object} Decoded token payload
 */
const verifyJWT = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Calculate time difference in minutes
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {number} Difference in minutes
 */
const calculateTimeDifference = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Format duration in minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
};

/**
 * Calculate completion percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {number} Completion percentage (0-100)
 */
const calculateCompletionPercentage = (completed, total) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize string by removing HTML tags and special characters
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

/**
 * Generate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination metadata
 */
const generatePaginationMetadata = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Get start and end of day for a given date
 * @param {Date|string} date - Date to process
 * @returns {object} Object with startOfDay and endOfDay
 */
const getStartAndEndOfDay = (date) => {
  const targetDate = new Date(date);
  
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
};

/**
 * Convert timezone
 * @param {Date} date - Date to convert
 * @param {string} timezone - Target timezone
 * @returns {Date} Converted date
 */
const convertTimezone = (date, timezone = 'UTC') => {
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
};

/**
 * Format date to ISO string with timezone
 * @param {Date} date - Date to format
 * @param {string} timezone - Timezone
 * @returns {string} Formatted date string
 */
const formatDateWithTimezone = (date, timezone = 'UTC') => {
  const convertedDate = convertTimezone(date, timezone);
  return convertedDate.toISOString();
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @param {string} timezone - Timezone to use for comparison
 * @returns {boolean} True if date is today
 */
const isToday = (date, timezone = 'UTC') => {
  const today = new Date();
  const targetDate = new Date(date);
  
  const todayStr = convertTimezone(today, timezone).toDateString();
  const targetStr = convertTimezone(targetDate, timezone).toDateString();
  
  return todayStr === targetStr;
};

/**
 * Generate API response object
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {object} data - Response data
 * @param {object} meta - Additional metadata
 * @returns {object} Formatted API response
 */
const generateAPIResponse = (success, message, data = null, meta = {}) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

module.exports = {
  generateRandomString,
  generateSecureToken,
  hashString,
  generateJWT,
  verifyJWT,
  calculateTimeDifference,
  formatDuration,
  calculateCompletionPercentage,
  isValidEmail,
  validatePassword,
  sanitizeString,
  generatePaginationMetadata,
  getStartAndEndOfDay,
  convertTimezone,
  formatDateWithTimezone,
  isToday,
  generateAPIResponse,
  sleep,
  retryWithBackoff
};
