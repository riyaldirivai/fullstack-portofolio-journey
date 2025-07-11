/**
 * ===========================================
 * DAY 4 - PRODUCTIVITY DASHBOARD API SERVER
 * Complete MongoDB + Backend Implementation
 * User: riyaldirivai
 * Date: 2025-07-10
 * ===========================================
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import custom modules
const logger = require('./config/logger');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const timerRoutes = require('./routes/timers');
const dashboardRoutes = require('./routes/dashboard');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.ENABLE_MORGAN_LOGGING === 'true') {
  app.use(morgan(process.env.LOG_FORMAT || 'combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

// Body parser middleware
app.use(express.json({ 
  limit: process.env.MAX_JSON_SIZE || '10mb' 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FORM_SIZE || '10mb' 
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api';
const apiVersion = process.env.API_VERSION || 'v1';
const basePath = `${apiPrefix}/${apiVersion}`;

// API Base route - Health check for /api/v1
app.get(basePath, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Productivity Dashboard API v1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `${basePath}/auth`,
      goals: `${basePath}/goals`,
      timers: `${basePath}/timers`,
      dashboard: `${basePath}/dashboard`
    },
    version: process.env.APP_VERSION || '1.0.0',
    author: process.env.APP_AUTHOR || 'riyaldirivai',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use(`${basePath}/auth`, authRoutes);
app.use(`${basePath}/goals`, goalRoutes);
app.use(`${basePath}/timers`, timerRoutes);
app.use(`${basePath}/dashboard`, dashboardRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Productivity Dashboard API',
    version: process.env.APP_VERSION || '1.0.0',
    author: process.env.APP_AUTHOR || 'riyaldirivai',
    environment: process.env.NODE_ENV,
    documentation: '/api-docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || 'localhost';
    
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📊 Database: ${process.env.DB_NAME}`);
      logger.info(`🔧 API Base: ${basePath}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close();
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        mongoose.connection.close();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
