/**
 * Database Configuration - MongoDB v8.0.11
 * Simple and reliable connection setup
 */

const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB Database
 */
const connectDB = async () => {
  try {
    // Simple MongoDB URI without database name
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.DB_NAME || 'productivity_dashboard';
    
    console.log('🔄 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoURI}`);
    console.log(`📦 Database: ${dbName}`);
    
    // Simplified connection options for local development
    const options = {
      dbName: dbName, // Specify database name here instead of in URI
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`🏠 Host: ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📊 Database: ${conn.connection.db.databaseName}`);
    
    // Setup connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('🟡 Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 Mongoose reconnected to MongoDB');
    });

    return conn;
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:');
    console.error('📝 Error Message:', error.message || 'Unknown error');
    console.error('🔢 Error Code:', error.code || 'No code');
    console.error('📋 Error Name:', error.name || 'Unknown');
    
    if (error.reason) {
      console.error('🔍 Reason:', error.reason);
    }
    
    logger.error('Database connection failed:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    
    process.exit(1);
  }
};

/**
 * Close Database Connection
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
    logger.info('Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
    logger.error('Error closing database connection:', error);
  }
};

/**
 * Get connection state in human readable format
 */
const getConnectionState = (state) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[state] || 'unknown';
};

/**
 * Database Health Check
 */
const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    
    const health = {
      status: getConnectionState(state),
      database: mongoose.connection.db?.databaseName || 'unknown',
      host: mongoose.connection.host || 'unknown',
      port: mongoose.connection.port || 'unknown',
      timestamp: new Date().toISOString()
    };

    if (state === 1) {
      // Test with a simple ping
      await mongoose.connection.db.admin().ping();
      health.ping = 'success';
    }

    return health;
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  connectDB,
  closeDB,
  checkDatabaseHealth,
  getConnectionState
};
