const { body, param, query, validationResult } = require("express-validator");
const { validationHelpers } = require("./helpers");

/**
 * Custom validation functions
 */

// Custom validator for MongoDB ObjectId
const isObjectId = (value) => {
  return validationHelpers.isValidObjectId(value);
};

// Custom validator for password strength
const isStrongPassword = (value) => {
  return validationHelpers.isValidPassword(value);
};

// Custom validator for hex color
const isHexColor = (value) => {
  return validationHelpers.isValidHexColor(value);
};

// Custom validator for future date
const isFutureDate = (value) => {
  return new Date(value) > new Date();
};

// Custom validator for positive number
const isPositiveNumber = (value) => {
  return !isNaN(value) && parseFloat(value) > 0;
};

/**
 * Validation Rules
 */

// User Validation Rules
const userValidationRules = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters")
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage("Name can only contain letters and spaces"),

    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),

    body("password")
      .isLength({ min: 8, max: 128 })
      .withMessage("Password must be between 8 and 128 characters")
      .custom(isStrongPassword)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],

  login: [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  updateProfile: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),

    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),

    body("timezone")
      .optional()
      .isString()
      .withMessage("Timezone must be a string"),

    body("preferences")
      .optional()
      .isObject()
      .withMessage("Preferences must be an object"),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 8, max: 128 })
      .withMessage("New password must be between 8 and 128 characters")
      .custom(isStrongPassword)
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),

    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match new password");
      }
      return true;
    }),
  ],
};

// Goal Validation Rules
const goalValidationRules = {
  create: [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),

    body("category")
      .custom(isObjectId)
      .withMessage("Category must be a valid ObjectId"),

    body("targetValue")
      .isFloat({ min: 0.1 })
      .withMessage("Target value must be a positive number"),

    body("currentValue")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Current value must be a non-negative number"),

    body("unit")
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage("Unit must be between 1 and 20 characters"),

    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Priority must be one of: low, medium, high, urgent"),

    body("deadline")
      .optional()
      .isISO8601()
      .custom(isFutureDate)
      .withMessage("Deadline must be a future date"),

    body("tags")
      .optional()
      .isArray({ max: 10 })
      .withMessage("Tags must be an array with maximum 10 items"),

    body("tags.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage("Each tag must be between 1 and 30 characters"),
  ],

  update: [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),

    body("category")
      .optional()
      .custom(isObjectId)
      .withMessage("Category must be a valid ObjectId"),

    body("targetValue")
      .optional()
      .isFloat({ min: 0.1 })
      .withMessage("Target value must be a positive number"),

    body("currentValue")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Current value must be a non-negative number"),

    body("priority")
      .optional()
      .isIn(["low", "medium", "high", "urgent"])
      .withMessage("Priority must be one of: low, medium, high, urgent"),

    body("status")
      .optional()
      .isIn(["active", "completed", "paused", "cancelled"])
      .withMessage(
        "Status must be one of: active, completed, paused, cancelled"
      ),
  ],

  updateProgress: [
    body("currentValue")
      .isFloat({ min: 0 })
      .withMessage("Current value must be a non-negative number"),
  ],
};

// Timer Validation Rules
const timerValidationRules = {
  start: [
    body("type")
      .isIn(["pomodoro", "focus", "break", "longbreak"])
      .withMessage("Type must be one of: pomodoro, focus, break, longbreak"),

    body("duration")
      .isInt({ min: 60000, max: 14400000 }) // 1 minute to 4 hours in milliseconds
      .withMessage("Duration must be between 1 minute and 4 hours"),

    body("goalId")
      .optional()
      .custom(isObjectId)
      .withMessage("Goal ID must be a valid ObjectId"),

    body("taskName")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Task name cannot exceed 100 characters"),
  ],
};

// Category Validation Rules
const categoryValidationRules = {
  create: [
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be between 1 and 50 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Description cannot exceed 200 characters"),

    body("color")
      .custom(isHexColor)
      .withMessage("Color must be a valid hex color (e.g., #FF0000)"),

    body("icon")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Icon name cannot exceed 50 characters"),
  ],

  update: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Name must be between 1 and 50 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Description cannot exceed 200 characters"),

    body("color")
      .optional()
      .custom(isHexColor)
      .withMessage("Color must be a valid hex color (e.g., #FF0000)"),
  ],
};

// Notification Validation Rules
const notificationValidationRules = {
  markAsRead: [
    body("notificationIds")
      .isArray({ min: 1 })
      .withMessage("Notification IDs must be a non-empty array"),

    body("notificationIds.*")
      .custom(isObjectId)
      .withMessage("Each notification ID must be a valid ObjectId"),
  ],
};

// Parameter Validation Rules
const paramValidationRules = {
  objectId: [
    param("id").custom(isObjectId).withMessage("ID must be a valid ObjectId"),
  ],
};

// Query Validation Rules
const queryValidationRules = {
  pagination: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
  ],

  dateRange: [
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid ISO date"),

    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid ISO date")
      .custom((value, { req }) => {
        if (
          req.query.startDate &&
          value &&
          new Date(value) <= new Date(req.query.startDate)
        ) {
          throw new Error("End date must be after start date");
        }
        return true;
      }),
  ],

  analytics: [
    query("period")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("Period must be between 1 and 365 days"),
  ],
};

/**
 * Validation Middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errors.array().map((error) => ({
          field: error.path,
          message: error.msg,
          value: error.value,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
};

// Export validation rules and middleware
module.exports = {
  // Validation rules
  userValidationRules,
  goalValidationRules,
  timerValidationRules,
  categoryValidationRules,
  notificationValidationRules,
  paramValidationRules,
  queryValidationRules,

  // Validation middleware
  validate,

  // Custom validators
  isObjectId,
  isStrongPassword,
  isHexColor,
  isFutureDate,
  isPositiveNumber,
};
