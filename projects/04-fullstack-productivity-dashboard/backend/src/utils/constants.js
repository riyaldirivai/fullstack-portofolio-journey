/**
 * Application Constants
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// Authentication Constants
const AUTH = {
  JWT_EXPIRES_IN: "24h",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 30 * 60 * 1000, // 30 minutes
  SALT_ROUNDS: 12,
};

// Goal Constants
const GOAL = {
  STATUS: {
    ACTIVE: "active",
    COMPLETED: "completed",
    PAUSED: "paused",
    CANCELLED: "cancelled",
  },
  PRIORITY: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
  },
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
  MAX_MILESTONES: 20,
};

// Timer Constants
const TIMER = {
  TYPES: {
    POMODORO: "pomodoro",
    FOCUS: "focus",
    BREAK: "break",
    LONG_BREAK: "longbreak",
  },
  STATUS: {
    ACTIVE: "active",
    PAUSED: "paused",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },
  DEFAULT_DURATIONS: {
    POMODORO: 25 * 60 * 1000, // 25 minutes
    FOCUS: 50 * 60 * 1000, // 50 minutes
    BREAK: 5 * 60 * 1000, // 5 minutes
    LONG_BREAK: 15 * 60 * 1000, // 15 minutes
  },
  MIN_DURATION: 60 * 1000, // 1 minute
  MAX_DURATION: 240 * 60 * 1000, // 4 hours
  MAX_TASK_NAME_LENGTH: 100,
};

// Notification Constants
const NOTIFICATION = {
  TYPES: {
    GOAL_REMINDER: "goal_reminder",
    GOAL_DEADLINE: "goal_deadline",
    GOAL_COMPLETED: "goal_completed",
    TIMER_COMPLETED: "timer_completed",
    ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
    WEEKLY_REPORT: "weekly_report",
    SYSTEM_UPDATE: "system_update",
  },
  PRIORITY: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
  },
  STATUS: {
    PENDING: "pending",
    SENT: "sent",
    DELIVERED: "delivered",
    READ: "read",
    FAILED: "failed",
  },
  CHANNELS: {
    IN_APP: "inApp",
    EMAIL: "email",
    PUSH: "push",
  },
  EXPIRY_DAYS: 30,
  MAX_TITLE_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 500,
};

// User Constants
const USER = {
  PREFERENCES: {
    THEMES: {
      LIGHT: "light",
      DARK: "dark",
      AUTO: "auto",
    },
    DEFAULT_VIEW: {
      OVERVIEW: "overview",
      GOALS: "goals",
      TIMER: "timer",
      ANALYTICS: "analytics",
    },
  },
  MAX_NAME_LENGTH: 50,
  PROFILE_PICTURE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};

// Category Constants
const CATEGORY = {
  MAX_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_ICON_LENGTH: 50,
  DEFAULT_CATEGORIES: [
    {
      name: "Work",
      description: "Professional tasks and projects",
      color: "#3B82F6",
      icon: "briefcase",
    },
    {
      name: "Personal",
      description: "Personal development and life goals",
      color: "#10B981",
      icon: "user",
    },
    {
      name: "Health",
      description: "Health and fitness related goals",
      color: "#F59E0B",
      icon: "heart",
    },
    {
      name: "Learning",
      description: "Education and skill development",
      color: "#8B5CF6",
      icon: "book",
    },
    {
      name: "Finance",
      description: "Financial goals and budgeting",
      color: "#EF4444",
      icon: "dollar-sign",
    },
    {
      name: "Hobby",
      description: "Hobbies and recreational activities",
      color: "#06B6D4",
      icon: "star",
    },
  ],
};

// Rate Limiting Constants
const RATE_LIMIT = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    message: "Too many requests from this IP, please try again later.",
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts per window
    message: "Too many login attempts, please try again later.",
  },
  API: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // API calls per minute
    message: "API rate limit exceeded, please slow down.",
  },
};

// File Upload Constants
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    DOCUMENTS: ["application/pdf", "text/plain", "application/msword"],
  },
  UPLOAD_PATH: "uploads/",
  TEMP_PATH: "temp/",
};

// Pagination Constants
const PAGINATION = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
};

// Cache Constants
const CACHE = {
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 60 * 60, // 1 hour
    VERY_LONG: 24 * 60 * 60, // 24 hours
  },
  KEYS: {
    USER_PROFILE: "user:profile:",
    GOAL_STATS: "goal:stats:",
    TIMER_STATS: "timer:stats:",
    DASHBOARD_DATA: "dashboard:",
    CATEGORIES: "categories:",
  },
};

// Email Templates
const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  GOAL_REMINDER: "goal_reminder",
  GOAL_DEADLINE: "goal_deadline",
  WEEKLY_REPORT: "weekly_report",
  PASSWORD_RESET: "password_reset",
  EMAIL_VERIFICATION: "email_verification",
};

// Analytics Constants
const ANALYTICS = {
  TIME_PERIODS: {
    DAY: "day",
    WEEK: "week",
    MONTH: "month",
    QUARTER: "quarter",
    YEAR: "year",
  },
  CHART_TYPES: {
    LINE: "line",
    BAR: "bar",
    PIE: "pie",
    DOUGHNUT: "doughnut",
    AREA: "area",
  },
};

// Error Messages
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: "Invalid email or password",
  TOKEN_EXPIRED: "Token has expired",
  TOKEN_INVALID: "Invalid token",
  ACCESS_DENIED: "Access denied",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",

  // Validation
  VALIDATION_ERROR: "Validation error",
  REQUIRED_FIELD: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, and number",
  INVALID_DATE: "Please enter a valid date",

  // Resources
  GOAL_NOT_FOUND: "Goal not found",
  TIMER_NOT_FOUND: "Timer session not found",
  CATEGORY_NOT_FOUND: "Category not found",
  NOTIFICATION_NOT_FOUND: "Notification not found",

  // Operations
  OPERATION_FAILED: "Operation failed",
  UPDATE_FAILED: "Update failed",
  DELETE_FAILED: "Delete failed",
  CREATE_FAILED: "Create failed",

  // Server
  INTERNAL_SERVER_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  DATABASE_ERROR: "Database connection error",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "Rate limit exceeded",
};

// Success Messages
const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTRATION_SUCCESS: "Registration successful",
  PASSWORD_CHANGED: "Password changed successfully",

  // CRUD Operations
  CREATED_SUCCESS: "Created successfully",
  UPDATED_SUCCESS: "Updated successfully",
  DELETED_SUCCESS: "Deleted successfully",

  // Specific Operations
  GOAL_COMPLETED: "Goal completed successfully",
  TIMER_STARTED: "Timer started successfully",
  TIMER_COMPLETED: "Timer session completed",
  PROFILE_UPDATED: "Profile updated successfully",
  SETTINGS_SAVED: "Settings saved successfully",
};

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  MONGODB_OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  HEX_COLOR: /^#[0-9A-F]{6}$/i,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9-]+$/,
};

// API Versions
const API_VERSIONS = {
  V1: "v1",
  CURRENT: "v1",
};

// Environment Constants
const ENVIRONMENT = {
  DEVELOPMENT: "development",
  TESTING: "testing",
  STAGING: "staging",
  PRODUCTION: "production",
};

module.exports = {
  HTTP_STATUS,
  AUTH,
  GOAL,
  TIMER,
  NOTIFICATION,
  USER,
  CATEGORY,
  RATE_LIMIT,
  FILE_UPLOAD,
  PAGINATION,
  CACHE,
  EMAIL_TEMPLATES,
  ANALYTICS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX,
  API_VERSIONS,
  ENVIRONMENT,
};
