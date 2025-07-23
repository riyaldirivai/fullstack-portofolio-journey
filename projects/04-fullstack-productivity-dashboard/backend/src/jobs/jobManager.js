/**
 * Job Manager
 * Central manager for all background jobs
 */

const logger = require('../utils/logger');
const reminderJob = require('./reminderJob');
const analyticsJob = require('./analyticsJob');

class JobManager {
  constructor() {
    this.jobs = {
      reminder: reminderJob,
      analytics: analyticsJob
    };
    this.isInitialized = false;
  }

  /**
   * Initialize and start all jobs
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('🔄 Job manager is already initialized');
      return;
    }

    logger.info('🚀 Initializing job manager...');

    try {
      // Start all jobs
      Object.entries(this.jobs).forEach(([name, job]) => {
        try {
          job.start();
          logger.info(`✅ Started ${name} jobs`);
        } catch (error) {
          logger.error(`❌ Failed to start ${name} jobs:`, error);
        }
      });

      this.isInitialized = true;
      logger.info('🎉 Job manager initialized successfully');

      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to initialize job manager:', error);
      throw error;
    }
  }

  /**
   * Shutdown all jobs gracefully
   */
  async shutdown() {
    if (!this.isInitialized) {
      logger.warn('📴 Job manager is not running');
      return;
    }

    logger.info('📴 Shutting down job manager...');

    try {
      // Stop all jobs
      Object.entries(this.jobs).forEach(([name, job]) => {
        try {
          job.stop();
          logger.info(`⏹️ Stopped ${name} jobs`);
        } catch (error) {
          logger.error(`❌ Error stopping ${name} jobs:`, error);
        }
      });

      this.isInitialized = false;
      logger.info('✅ Job manager shut down successfully');

    } catch (error) {
      logger.error('❌ Error during job manager shutdown:', error);
      throw error;
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    const status = {
      isInitialized: this.isInitialized,
      jobs: {}
    };

    Object.entries(this.jobs).forEach(([name, job]) => {
      try {
        status.jobs[name] = job.getStatus();
      } catch (error) {
        status.jobs[name] = { error: error.message };
      }
    });

    return status;
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobType, jobName) {
    if (!this.jobs[jobType]) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    logger.info(`🏃‍♂️ Running ${jobType}.${jobName} manually...`);

    try {
      await this.jobs[jobType].runJob(jobName);
      logger.info(`✅ Successfully ran ${jobType}.${jobName}`);
    } catch (error) {
      logger.error(`❌ Failed to run ${jobType}.${jobName}:`, error);
      throw error;
    }
  }

  /**
   * Restart specific job type
   */
  async restartJobType(jobType) {
    if (!this.jobs[jobType]) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    logger.info(`🔄 Restarting ${jobType} jobs...`);

    try {
      this.jobs[jobType].stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      this.jobs[jobType].start();
      logger.info(`✅ Restarted ${jobType} jobs successfully`);
    } catch (error) {
      logger.error(`❌ Failed to restart ${jobType} jobs:`, error);
      throw error;
    }
  }

  /**
   * Get job statistics
   */
  async getJobStatistics() {
    const stats = {
      timestamp: new Date(),
      overview: {
        totalJobTypes: Object.keys(this.jobs).length,
        runningJobTypes: 0,
        totalActiveJobs: 0
      },
      details: {}
    };

    Object.entries(this.jobs).forEach(([name, job]) => {
      try {
        const jobStatus = job.getStatus();
        stats.details[name] = jobStatus;
        
        if (jobStatus.isRunning) {
          stats.overview.runningJobTypes++;
          stats.overview.totalActiveJobs += jobStatus.jobCount || 0;
        }
      } catch (error) {
        stats.details[name] = { error: error.message };
      }
    });

    return stats;
  }

  /**
   * Health check for jobs
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {}
    };

    let allHealthy = true;

    for (const [name, job] of Object.entries(this.jobs)) {
      try {
        const jobStatus = job.getStatus();
        
        health.checks[name] = {
          status: jobStatus.isRunning ? 'running' : 'stopped',
          activeJobs: jobStatus.jobCount || 0,
          details: jobStatus
        };

        // Consider it unhealthy if jobs should be running but aren't
        if (this.isInitialized && !jobStatus.isRunning) {
          health.checks[name].status = 'unhealthy';
          allHealthy = false;
        }

      } catch (error) {
        health.checks[name] = {
          status: 'error',
          error: error.message
        };
        allHealthy = false;
      }
    }

    if (!allHealthy) {
      health.status = 'unhealthy';
    }

    return health;
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const handleShutdown = async (signal) => {
      logger.info(`📡 Received ${signal}, starting graceful shutdown...`);
      try {
        await this.shutdown();
        logger.info('👋 Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGUSR2', () => handleShutdown('SIGUSR2')); // Nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      logger.error('❌ Uncaught exception:', error);
      try {
        await this.shutdown();
      } catch (shutdownError) {
        logger.error('❌ Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      logger.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
      try {
        await this.shutdown();
      } catch (shutdownError) {
        logger.error('❌ Error during emergency shutdown:', shutdownError);
      }
      process.exit(1);
    });
  }

  /**
   * Test mode - run jobs with shorter intervals for testing
   */
  async enableTestMode() {
    logger.warn('⚠️ Enabling test mode - jobs will run more frequently');

    if (this.isInitialized) {
      await this.shutdown();
    }

    // Override job schedules for testing
    // This would be implemented differently in each job class
    // For now, we'll just log the intention
    logger.info('🧪 Test mode enabled - use manual job execution for testing');
  }

  /**
   * Get job execution history (if implemented in job classes)
   */
  async getJobHistory(jobType, limit = 10) {
    // This would return execution history for specific job types
    // Implementation depends on whether jobs store their execution history
    return {
      jobType,
      limit,
      history: [],
      message: 'Job history tracking not yet implemented'
    };
  }

  /**
   * Schedule one-time job execution
   */
  async scheduleOneTimeJob(jobType, jobName, delayMs = 0) {
    if (!this.jobs[jobType]) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    logger.info(`⏰ Scheduling one-time execution of ${jobType}.${jobName} in ${delayMs}ms`);

    setTimeout(async () => {
      try {
        await this.runJob(jobType, jobName);
      } catch (error) {
        logger.error(`❌ Scheduled job ${jobType}.${jobName} failed:`, error);
      }
    }, delayMs);

    return {
      scheduled: true,
      jobType,
      jobName,
      delayMs,
      scheduledAt: new Date()
    };
  }
}

// Export singleton instance
module.exports = new JobManager();
