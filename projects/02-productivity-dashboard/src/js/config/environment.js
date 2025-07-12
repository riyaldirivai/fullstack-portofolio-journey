/**
 * ===========================================
 * ENVIRONMENT CONFIGURATION
 * Centralized configuration for different environments
 * Author: riyaldirivai
 * Date: 2025-07-11
 * ===========================================
 */

// 🌍 Environment Configuration
const environments = {
  // Development environment (local backend server)
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    WS_URL: 'ws://localhost:3000',
    
    // Request configuration
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    // Feature flags
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: true,
    ENABLE_MOCK_FALLBACK: true,
    
    // Storage configuration
    STORAGE_PREFIX: 'productivity_dev_',
    
    // Rate limiting
    MAX_REQUESTS_PER_MINUTE: 100
  },

  // Staging environment (for testing)
  staging: {
    API_BASE_URL: 'https://api-staging.yourdomain.com',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    WS_URL: 'wss://api-staging.yourdomain.com',
    
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 2000,
    
    ENABLE_LOGGING: true,
    ENABLE_DEBUG: false,
    ENABLE_MOCK_FALLBACK: false,
    
    STORAGE_PREFIX: 'productivity_staging_',
    
    MAX_REQUESTS_PER_MINUTE: 80
  },

  // Production environment
  production: {
    API_BASE_URL: 'https://api.yourdomain.com',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    WS_URL: 'wss://api.yourdomain.com',
    
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 2000,
    
    ENABLE_LOGGING: false,
    ENABLE_DEBUG: false,
    ENABLE_MOCK_FALLBACK: false,
    
    STORAGE_PREFIX: 'productivity_',
    
    MAX_REQUESTS_PER_MINUTE: 60
  }
};

/**
 * 🔧 Environment Detection and Configuration
 */
class EnvironmentConfig {
  constructor() {
    this.currentEnv = this._detectEnvironment();
    this.config = environments[this.currentEnv];
    
    // Log current environment (only in dev/staging)
    if (this.config.ENABLE_LOGGING) {
      console.log(`🌍 Environment: ${this.currentEnv.toUpperCase()}`);
      console.log(`🔗 API URL: ${this.getApiUrl()}`);
    }
  }

  /**
   * Detect current environment based on various factors
   */
  _detectEnvironment() {
    // 1. Check explicit environment variable (if available)
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
      return process.env.NODE_ENV;
    }

    // 2. Check URL-based detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
      
      if (hostname.includes('staging') || hostname.includes('dev.')) {
        return 'staging';
      }
      
      // Default to production for any other domain
      return 'production';
    }

    // 3. Default fallback
    return 'development';
  }

  /**
   * Get current environment name
   */
  getEnvironment() {
    return this.currentEnv;
  }

  /**
   * Get complete API URL
   */
  getApiUrl() {
    return `${this.config.API_BASE_URL}${this.config.API_PREFIX}/${this.config.API_VERSION}`;
  }

  /**
   * Get WebSocket URL
   */
  getWebSocketUrl() {
    return this.config.WS_URL;
  }

  /**
   * Get configuration value
   */
  get(key) {
    return this.config[key];
  }

  /**
   * Check if development environment
   */
  isDevelopment() {
    return this.currentEnv === 'development';
  }

  /**
   * Check if production environment
   */
  isProduction() {
    return this.currentEnv === 'production';
  }

  /**
   * Check if staging environment
   */
  isStaging() {
    return this.currentEnv === 'staging';
  }

  /**
   * Get storage key with environment prefix
   */
  getStorageKey(key) {
    return `${this.config.STORAGE_PREFIX}${key}`;
  }

  /**
   * Logger that respects environment settings
   */
  log(level, message, ...args) {
    if (!this.config.ENABLE_LOGGING && level !== 'error') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        if (this.config.ENABLE_DEBUG) {
          console.debug(prefix, message, ...args);
        }
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  /**
   * Get all configuration for debugging
   */
  getFullConfig() {
    return {
      environment: this.currentEnv,
      config: this.config
    };
  }
}

// Create singleton instance
const envConfig = new EnvironmentConfig();

// Export for different module systems
export default envConfig;

// CommonJS support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = envConfig;
}

// Browser global support
if (typeof window !== 'undefined') {
  window.EnvironmentConfig = envConfig;
}

// Additional exports
export { environments, EnvironmentConfig };
