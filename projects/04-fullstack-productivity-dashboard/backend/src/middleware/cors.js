const cors = require("cors");
const { logger } = require("../utils/logger");

/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing
 */

// Default CORS options
const defaultCorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Get allowed origins from environment
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000", "http://localhost:3001"];

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn("CORS blocked request", { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "X-Client-Version",
    "X-Request-ID",
  ],
  exposedHeaders: [
    "X-Total-Count",
    "X-Page-Count",
    "X-Current-Page",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
  ],
  credentials: true, // Allow cookies
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

/**
 * Development CORS Configuration
 * More permissive for development
 */
const developmentCorsOptions = {
  origin: true, // Allow all origins in development
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Production CORS Configuration
 * Strict configuration for production
 */
const productionCorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

    // Always allow same-origin requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.error("CORS violation attempt", {
        origin,
        allowedOrigins,
        timestamp: new Date().toISOString(),
      });
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
  ],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

/**
 * API-specific CORS Configuration
 * For API routes with different requirements
 */
const apiCorsOptions = {
  origin: function (origin, callback) {
    // API keys can be used from any origin
    const hasApiKey = this.req && this.req.headers["x-api-key"];

    if (hasApiKey) {
      return callback(null, true);
    }

    // Otherwise use default origin checking
    return defaultCorsOptions.origin(origin, callback);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-API-Key",
    "X-Client-Version",
  ],
  credentials: false, // API keys don't need credentials
  maxAge: 3600,
};

/**
 * Public API CORS Configuration
 * For public endpoints that can be accessed from anywhere
 */
const publicCorsOptions = {
  origin: "*",
  methods: ["GET"],
  allowedHeaders: ["Content-Type", "Accept"],
  credentials: false,
  maxAge: 3600,
};

/**
 * File Upload CORS Configuration
 * For file upload endpoints
 */
const uploadCorsOptions = {
  ...defaultCorsOptions,
  allowedHeaders: [
    ...defaultCorsOptions.allowedHeaders,
    "Content-Length",
    "Content-Range",
    "X-File-Name",
    "X-File-Size",
  ],
};

/**
 * WebSocket CORS Configuration
 * For WebSocket connections
 */
const websocketCorsOptions = {
  origin: function (origin, callback) {
    // WebSocket origins need special handling
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

/**
 * Dynamic CORS Configuration
 * Chooses CORS config based on environment
 */
const getDynamicCorsOptions = () => {
  const env = process.env.NODE_ENV || "development";

  switch (env) {
    case "production":
      return productionCorsOptions;
    case "staging":
      return defaultCorsOptions;
    case "development":
    case "test":
      return developmentCorsOptions;
    default:
      return defaultCorsOptions;
  }
};

/**
 * CORS Middleware Factory
 * Creates CORS middleware based on route type
 */
const createCorsMiddleware = (type = "default") => {
  let options;

  switch (type) {
    case "api":
      options = apiCorsOptions;
      break;
    case "public":
      options = publicCorsOptions;
      break;
    case "upload":
      options = uploadCorsOptions;
      break;
    case "websocket":
      options = websocketCorsOptions;
      break;
    case "dynamic":
      options = getDynamicCorsOptions();
      break;
    default:
      options = defaultCorsOptions;
  }

  return cors(options);
};

/**
 * CORS Error Handler
 * Handles CORS-related errors
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    logger.warn("CORS error", {
      origin: req.headers.origin,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return res.status(403).json({
      success: false,
      message: "CORS error: Origin not allowed",
      timestamp: new Date().toISOString(),
    });
  }

  next(err);
};

/**
 * Custom CORS Headers Middleware
 * Adds custom CORS headers
 */
const customCorsHeaders = (req, res, next) => {
  // Add security headers
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");

  // Add custom CORS headers
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Max-Age", "86400");
    return res.status(200).end();
  }

  next();
};

/**
 * CORS Logging Middleware
 * Logs CORS requests for monitoring
 */
const corsLogger = (req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    logger.debug("CORS request", {
      origin,
      method: req.method,
      url: req.url,
      referer: req.headers.referer,
      userAgent: req.get("User-Agent"),
    });
  }

  next();
};

/**
 * Subdomain CORS Handler
 * Allows requests from subdomains
 */
const subdomainCorsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",") || [];

    // Check if origin matches any allowed domain or subdomain
    const isAllowed = allowedDomains.some((domain) => {
      const regex = new RegExp(
        `^https?:\\/\\/([a-z0-9-]+\\.)?${domain.replace(".", "\\.")}$`
      );
      return regex.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = {
  // Pre-configured CORS options
  defaultCorsOptions,
  developmentCorsOptions,
  productionCorsOptions,
  apiCorsOptions,
  publicCorsOptions,
  uploadCorsOptions,
  websocketCorsOptions,
  subdomainCorsOptions,

  // Dynamic CORS
  getDynamicCorsOptions,
  createCorsMiddleware,

  // CORS utilities
  corsErrorHandler,
  customCorsHeaders,
  corsLogger,
};
