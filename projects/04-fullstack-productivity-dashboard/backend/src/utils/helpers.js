const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { logger } = require("./logger");

/**
 * Helper functions for common operations
 */

// Date and Time Helpers
const dateHelpers = {
  // Get start of day
  getStartOfDay: (date = new Date()) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  // Get end of day
  getEndOfDay: (date = new Date()) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  // Get start of week
  getStartOfWeek: (date = new Date()) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  // Get end of week
  getEndOfWeek: (date = new Date()) => {
    const end = new Date(date);
    const day = end.getDay();
    const diff = end.getDate() - day + 6;
    end.setDate(diff);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  // Get start of month
  getStartOfMonth: (date = new Date()) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  // Get end of month
  getEndOfMonth: (date = new Date()) => {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  },

  // Format duration in milliseconds to human readable
  formatDuration: (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  // Check if date is today
  isToday: (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  // Get days between two dates
  getDaysBetween: (startDate, endDate) => {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },
};

// String Helpers
const stringHelpers = {
  // Generate random string
  generateRandomString: (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
  },

  // Capitalize first letter
  capitalize: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Convert to slug
  slugify: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  },

  // Truncate string
  truncate: (str, length = 100, suffix = "...") => {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  // Generate initials from name
  getInitials: (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  },
};

// Validation Helpers
const validationHelpers = {
  // Validate email format
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password strength
  isValidPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  // Validate MongoDB ObjectId
  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Validate URL
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validate hex color
  isValidHexColor: (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  },
};

// Response Helpers
const responseHelpers = {
  // Success response
  success: (res, data = null, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  // Error response
  error: (
    res,
    message = "Internal Server Error",
    statusCode = 500,
    errors = null
  ) => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  },

  // Validation error response
  validationError: (res, errors) => {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
      timestamp: new Date().toISOString(),
    });
  },

  // Paginated response
  paginated: (res, data, pagination, message = "Success") => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.total,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPrevPage: pagination.page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  },
};

// JWT Helpers
const jwtHelpers = {
  // Generate JWT token
  generateToken: (payload, expiresIn = "24h") => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  },

  // Verify JWT token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error("JWT verification failed:", error);
      return null;
    }
  },

  // Decode JWT token without verification
  decodeToken: (token) => {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error("JWT decode failed:", error);
      return null;
    }
  },
};

// Pagination Helpers
const paginationHelpers = {
  // Calculate pagination parameters
  getPaginationParams: (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  },

  // Create pagination metadata
  createPaginationMeta: (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  },
};

// Cache Helpers
const cacheHelpers = {
  // Generate cache key
  generateCacheKey: (prefix, ...parts) => {
    return `${prefix}:${parts.join(":")}`;
  },

  // Parse cache TTL
  parseTTL: (ttl) => {
    if (typeof ttl === "number") return ttl;

    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        return 3600;
    }
  },
};

// File Helpers
const fileHelpers = {
  // Get file extension
  getFileExtension: (filename) => {
    return filename.split(".").pop().toLowerCase();
  },

  // Check if file is image
  isImageFile: (filename) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    const extension = fileHelpers.getFileExtension(filename);
    return imageExtensions.includes(extension);
  },

  // Generate unique filename
  generateUniqueFilename: (originalFilename) => {
    const extension = fileHelpers.getFileExtension(originalFilename);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    return `${timestamp}_${random}.${extension}`;
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
};

// Async wrapper for error handling
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Rate limiting helpers
const rateLimitHelpers = {
  // Create rate limit key
  createKey: (identifier, endpoint) => {
    return `rate_limit:${identifier}:${endpoint}`;
  },

  // Get client identifier
  getClientIdentifier: (req) => {
    return req.userId || req.ip || "anonymous";
  },
};

module.exports = {
  dateHelpers,
  stringHelpers,
  validationHelpers,
  responseHelpers,
  jwtHelpers,
  paginationHelpers,
  cacheHelpers,
  fileHelpers,
  rateLimitHelpers,
  asyncHandler,
};
