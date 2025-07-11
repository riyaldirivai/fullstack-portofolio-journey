/**
 * Validation Middleware
 * Handles request validation using express-validator and Joi
 */

const { body, param, query, validationResult } = require('express-validator');
const Joi = require('joi');
const { AppError, formatValidationError } = require('./errorHandler');

// Handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationError(errors.array());
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// User validation schemas
const userValidation = {
  // Register validation
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    handleValidationErrors
  ],

  // Login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  // Update profile validation
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('timezone')
      .optional()
      .isString()
      .withMessage('Timezone must be a valid string'),
    body('preferences.theme')
      .optional()
      .isIn(['light', 'dark', 'auto'])
      .withMessage('Theme must be light, dark, or auto'),
    handleValidationErrors
  ],

  // Change password validation
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Goal validation schemas
const goalValidation = {
  // Create goal validation
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Goal title is required and must be less than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('category')
      .isIn(['work', 'personal', 'health', 'education', 'finance', 'relationships', 'hobby', 'other'])
      .withMessage('Category must be one of: work, personal, health, education, finance, relationships, hobby, other'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('estimatedDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be at least 1 minute'),
    body('deadlineDate')
      .optional()
      .isISO8601()
      .toDate()
      .custom((value) => {
        if (value && value <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      }),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .trim()
      .isLength({ max: 30 })
      .withMessage('Each tag must be less than 30 characters'),
    handleValidationErrors
  ],

  // Update goal validation
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid goal ID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Goal title must be less than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('category')
      .optional()
      .isIn(['work', 'personal', 'health', 'education', 'finance', 'relationships', 'hobby', 'other'])
      .withMessage('Category must be one of: work, personal, health, education, finance, relationships, hobby, other'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be one of: low, medium, high, urgent'),
    body('status')
      .optional()
      .isIn(['not_started', 'in_progress', 'completed', 'paused', 'cancelled'])
      .withMessage('Status must be one of: not_started, in_progress, completed, paused, cancelled'),
    body('progress')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be between 0 and 100'),
    handleValidationErrors
  ],

  // Add sub-goal validation
  addSubGoal: [
    param('id')
      .isMongoId()
      .withMessage('Invalid goal ID'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Sub-goal title is required and must be less than 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Sub-goal description must be less than 300 characters'),
    handleValidationErrors
  ]
};

// Timer validation schemas
const timerValidation = {
  // Create timer validation
  create: [
    body('type')
      .isIn(['pomodoro', 'focus', 'break', 'custom'])
      .withMessage('Timer type must be one of: pomodoro, focus, break, custom'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Timer name must be less than 100 characters'),
    body('plannedDuration')
      .isInt({ min: 1, max: 480 })
      .withMessage('Planned duration must be between 1 and 480 minutes'),
    body('goalId')
      .optional()
      .isMongoId()
      .withMessage('Invalid goal ID'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('Description must be less than 300 characters'),
    handleValidationErrors
  ],

  // Update timer validation
  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid timer ID'),
    body('status')
      .optional()
      .isIn(['running', 'paused', 'completed', 'cancelled'])
      .withMessage('Status must be one of: running, paused, completed, cancelled'),
    body('focusScore')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Focus score must be between 1 and 10'),
    body('productivityRating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Productivity rating must be between 1 and 5'),
    body('energyLevel')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Energy level must be between 1 and 5'),
    handleValidationErrors
  ],

  // Add interruption validation
  addInterruption: [
    param('id')
      .isMongoId()
      .withMessage('Invalid timer ID'),
    body('type')
      .isIn(['phone', 'email', 'person', 'notification', 'other'])
      .withMessage('Interruption type must be one of: phone, email, person, notification, other'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Description must be less than 100 characters'),
    body('duration')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Duration must be a positive number'),
    handleValidationErrors
  ]
};

// Common validation schemas
const commonValidation = {
  // MongoDB ObjectId validation
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
    handleValidationErrors
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isString()
      .withMessage('Sort must be a string'),
    handleValidationErrors
  ],

  // Date range validation
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .toDate()
      .withMessage('End date must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (value && req.query.startDate && value <= new Date(req.query.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    handleValidationErrors
  ]
};

// Joi validation wrapper
const joiValidation = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'JOI_VALIDATION_ERROR',
        errors,
        timestamp: new Date().toISOString()
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Joi schemas for complex validations
const joiSchemas = {
  // Goal creation with complex sub-goal validation
  createGoalWithSubGoals: Joi.object({
    title: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(500).optional(),
    category: Joi.string().valid('work', 'personal', 'health', 'education', 'finance', 'relationships', 'hobby', 'other').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    estimatedDuration: Joi.number().integer().min(1).optional(),
    deadlineDate: Joi.date().greater('now').optional(),
    tags: Joi.array().items(Joi.string().trim().max(30)).optional(),
    subGoals: Joi.array().items(
      Joi.object({
        title: Joi.string().trim().min(1).max(100).required(),
        description: Joi.string().trim().max(300).optional(),
        order: Joi.number().integer().min(0).optional()
      })
    ).optional(),
    pomodoroSettings: Joi.object({
      enabled: Joi.boolean().default(false),
      workDuration: Joi.number().integer().min(1).max(60).default(25),
      breakDuration: Joi.number().integer().min(1).max(30).default(5),
      longBreakDuration: Joi.number().integer().min(1).max(60).default(15),
      longBreakInterval: Joi.number().integer().min(1).max(10).default(4)
    }).optional()
  })
};

module.exports = {
  userValidation,
  goalValidation,
  timerValidation,
  commonValidation,
  joiValidation,
  joiSchemas,
  handleValidationErrors
};
