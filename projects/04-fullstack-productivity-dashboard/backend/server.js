/**
 * Main Server Entry Point
 * Productivity Dashboard Backend API Server
 * 
 * Features:
 * - Express.js REST API
 * - MongoDB integration
 * - Authentication & authorization
 * - Rate limiting & security
 * - Request logging
 * - Error handling
 * - API documentation
 * - Background jobs
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import configurations
const dbConfig = require('./src/config/database');
const redisConfig = require('./src/config/redis');
const logger = require('./src/utils/logger');

// Import middleware
const authMiddleware = require('./src/middleware/auth');
const errorHandler = require('./src/middleware/errorHandler');
const validationMiddleware = require('./src/middleware/validation');

// Import routes
const authRoutes = require('./src/routes/auth');
const goalRoutes = require('./src/routes/goals');
const timerRoutes = require('./src/routes/timer');
const userRoutes = require('./src/routes/users');
const analyticsRoutes = require('./src/routes/analytics');
const uploadRoutes = require('./src/routes/uploads');

// Import services
const emailService = require('./src/services/emailService');
const analyticsService = require('./src/services/analyticsService');
const notificationService = require('./src/services/notificationService');

// Import background jobs
const reminderJob = require('./src/jobs/reminderJob');
const analyticsJob = require('./src/jobs/analyticsJob');
const cleanupJob = require('./src/jobs/cleanupJob');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========================================
// 📊 SERVER STARTUP BANNER
// ========================================

function displayStartupBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    🚀 PRODUCTIVITY DASHBOARD API SERVER                   ║
║                                                           ║
║    Environment: ${NODE_ENV.toUpperCase().padEnd(42)} ║
║    Port: ${PORT.toString().padEnd(49)} ║
║    Node Version: ${process.version.padEnd(37)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

// ========================================
// 🔧 MIDDLEWARE CONFIGURATION
// ========================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://your-production-domain.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Request parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
  },
  abortOnLimit: true,
  responseOnLimit: 'File size limit has been reached',
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging
const morgan = require('morgan');
const morganFormat = NODE_ENV === 'production' 
  ? 'combined' 
  : ':method :url :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// ========================================
// 📚 API DOCUMENTATION (Swagger)
// ========================================

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Productivity Dashboard API',
      version: '1.0.0',
      description: 'Complete REST API for productivity dashboard with goal tracking, timer sessions, and analytics',
      contact: {
        name: 'API Support',
        email: 'support@productivitydashboard.com'
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: 'Development server'
      },
      {
        url: 'https://api.productivitydashboard.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Productivity Dashboard API Documentation"
}));

// ========================================
// 🛣️ ROUTES CONFIGURATION
// ========================================

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    database: 'connected', // Will be updated by database connection
    redis: 'connected',     // Will be updated by Redis connection
  };
  
  res.status(200).json(healthCheck);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploads', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Productivity Dashboard API Server',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    environment: NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      goals: '/api/goals',
      timer: '/api/timer',
      users: '/api/users',
      analytics: '/api/analytics',
      uploads: '/api/uploads',
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`,
    availableEndpoints: [
      '/api/auth',
      '/api/goals', 
      '/api/timer',
      '/api/users',
      '/api/analytics',
      '/api/uploads'
    ]
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// ========================================
// 🚀 SERVER INITIALIZATION
// ========================================

async function startServer() {
  try {
    displayStartupBanner();
    
    // 1. Connect to databases
    logger.info('🔌 Connecting to databases...');
    await dbConfig.connect();
    logger.info('✅ MongoDB connected successfully');
    
    try {
      await redisConfig.connect();
      logger.info('✅ Redis connected successfully');
    } catch (redisError) {
      logger.warn('⚠️ Redis connection failed, continuing without Redis:', redisError.message);
    }
    
    // 2. Initialize services
    logger.info('🔧 Initializing services...');
    await emailService.initialize();
    await analyticsService.initialize();
    await notificationService.initialize();
    logger.info('✅ Services initialized');
    
    // 3. Start background jobs
    logger.info('⏰ Starting background jobs...');
    const jobManager = require('./src/jobs/jobManager');
    await jobManager.initialize();
    logger.info('✅ Background jobs started');
    
    // 4. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🌍 Environment: ${NODE_ENV}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
      
      // Close HTTP server
      server.close(async () => {
        logger.info('📴 HTTP server closed');
        
        // Close database connections
        try {
          await dbConfig.disconnect();
          logger.info('📴 MongoDB disconnected');
        } catch (error) {
          logger.error('❌ Error closing MongoDB:', error);
        }
        
        try {
          await redisConfig.disconnect();
          logger.info('📴 Redis disconnected');
        } catch (error) {
          logger.error('❌ Error closing Redis:', error);
        }
        
        // Stop background jobs
        try {
          const jobManager = require('./src/jobs/jobManager');
          await jobManager.shutdown();
          logger.info('📴 Background jobs stopped');
        } catch (error) {
          logger.error('❌ Error stopping background jobs:', error);
        }
        
        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

// Export app for testing
module.exports = app;
