/**
 * CORS Configuration
 * Cross-Origin Resource Sharing setup for the API
 */

const cors = require('cors');

// Allowed origins from environment variable or defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ];

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and credentials
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page'
  ]
};

// Development mode - allow all origins
if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = true;
}

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Enhanced CORS middleware with additional security
const enhancedCors = (req, res, next) => {
  // Apply basic CORS
  corsMiddleware(req, res, (err) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'CORS policy violation',
        error: err.message
      });
    }

    // Additional security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Cache control for preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400'); // 24 hours
      return res.status(200).end();
    }

    next();
  });
};

module.exports = {
  corsOptions,
  corsMiddleware,
  enhancedCors,
  allowedOrigins
};
