const { validationResult } = require("express-validator");
const { logger } = require("../utils/logger");
const { responseHelpers } = require("../utils/helpers");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../utils/constants");

/**
 * Input Validation Middleware
 * Handles validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    logger.warn("Validation failed", {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      userId: req.userId || "anonymous",
    });

    return responseHelpers.validationError(res, formattedErrors);
  }

  next();
};

/**
 * Sanitize Input Middleware
 * Sanitizes common input fields to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
  // Helper function to sanitize string
  const sanitizeString = (str) => {
    if (typeof str !== "string") return str;

    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "string") {
      return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    if (typeof obj === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * File Upload Validation Middleware
 * Validates uploaded files
 */
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    required = false,
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return responseHelpers.error(
        res,
        "File is required",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (req.file) {
      // Check file size
      if (req.file.size > maxSize) {
        return responseHelpers.error(
          res,
          `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Check file type
      if (!allowedTypes.includes(req.file.mimetype)) {
        return responseHelpers.error(
          res,
          `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Additional security checks
      if (req.file.originalname.includes("..")) {
        return responseHelpers.error(
          res,
          "Invalid filename",
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    next();
  };
};

/**
 * Request Size Limit Middleware
 * Limits the size of request payload
 */
const limitRequestSize = (limit = "10mb") => {
  return (req, res, next) => {
    const contentLength = req.headers["content-length"];

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const limitInBytes = parseLimit(limit);

      if (sizeInBytes > limitInBytes) {
        return responseHelpers.error(
          res,
          "Request payload too large",
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    next();
  };
};

// Helper function to parse limit string to bytes
const parseLimit = (limit) => {
  if (typeof limit === "number") return limit;

  const match = limit.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();

  switch (unit) {
    case "kb":
      return value * 1024;
    case "mb":
      return value * 1024 * 1024;
    case "gb":
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
};

/**
 * JSON Schema Validation Middleware
 * Validates request body against JSON schema
 */
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      // Simple schema validation (you can use libraries like ajv for complex schemas)
      const isValid = validateAgainstSchema(req.body, schema);

      if (!isValid) {
        return responseHelpers.error(
          res,
          "Request body does not match required schema",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      next();
    } catch (error) {
      logger.error("Schema validation error:", error);
      return responseHelpers.error(
        res,
        ERROR_MESSAGES.VALIDATION_ERROR,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  };
};

// Simple schema validation function
const validateAgainstSchema = (data, schema) => {
  // This is a basic implementation
  // For production, consider using a library like ajv
  if (schema.type === "object" && typeof data !== "object") {
    return false;
  }

  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in data)) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Content Type Validation Middleware
 * Ensures request has correct content type
 */
const requireContentType = (expectedType = "application/json") => {
  return (req, res, next) => {
    const contentType = req.headers["content-type"];

    if (!contentType || !contentType.includes(expectedType)) {
      return responseHelpers.error(
        res,
        `Content-Type must be ${expectedType}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    next();
  };
};

/**
 * Query Parameter Validation Middleware
 * Validates and sanitizes query parameters
 */
const validateQueryParams = (allowedParams = []) => {
  return (req, res, next) => {
    const queryKeys = Object.keys(req.query);
    const invalidParams = queryKeys.filter(
      (key) => !allowedParams.includes(key)
    );

    if (invalidParams.length > 0) {
      return responseHelpers.error(
        res,
        `Invalid query parameters: ${invalidParams.join(", ")}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    next();
  };
};

/**
 * Request ID Validation Middleware
 * Validates MongoDB ObjectId parameters
 */
const validateObjectIdParams = (paramNames = ["id"]) => {
  return (req, res, next) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    for (const paramName of paramNames) {
      const paramValue = req.params[paramName];

      if (paramValue && !objectIdRegex.test(paramValue)) {
        return responseHelpers.error(
          res,
          `Invalid ${paramName} format`,
          HTTP_STATUS.BAD_REQUEST
        );
      }
    }

    next();
  };
};

/**
 * Password Strength Validation Middleware
 * Validates password meets security requirements
 */
const validatePasswordStrength = (req, res, next) => {
  const password = req.body.password || req.body.newPassword;

  if (!password) {
    return next(); // Let other validation handle required field
  }

  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  // Optional: require special characters
  // if (!hasSpecialChar) {
  //   errors.push('Password must contain at least one special character');
  // }

  if (errors.length > 0) {
    return responseHelpers.validationError(
      res,
      errors.map((msg) => ({
        field: "password",
        message: msg,
      }))
    );
  }

  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  validateFileUpload,
  limitRequestSize,
  validateSchema,
  requireContentType,
  validateQueryParams,
  validateObjectIdParams,
  validatePasswordStrength,
};
