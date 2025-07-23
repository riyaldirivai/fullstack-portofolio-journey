/**
 * Admin Routes
 * Routes for job management and system administration
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const jobManager = require('../jobs/jobManager');
const logger = require('../utils/logger');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
  next();
};

/**
 * @swagger
 * /api/admin/jobs/status:
 *   get:
 *     summary: Get status of all background jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isInitialized:
 *                       type: boolean
 *                     jobs:
 *                       type: object
 *       403:
 *         description: Access denied - Admin role required
 */
router.get('/jobs/status', auth, requireAdmin, (req, res) => {
  try {
    const status = jobManager.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status'
    });
  }
});

/**
 * @swagger
 * /api/admin/jobs/health:
 *   get:
 *     summary: Get health status of all jobs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job health status retrieved successfully
 *       503:
 *         description: One or more jobs are unhealthy
 */
router.get('/jobs/health', auth, requireAdmin, async (req, res) => {
  try {
    const health = await jobManager.healthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    logger.error('Error checking job health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check job health'
    });
  }
});

/**
 * @swagger
 * /api/admin/jobs/statistics:
 *   get:
 *     summary: Get detailed job statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job statistics retrieved successfully
 */
router.get('/jobs/statistics', auth, requireAdmin, async (req, res) => {
  try {
    const stats = await jobManager.getJobStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting job statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job statistics'
    });
  }
});

/**
 * @swagger
 * /api/admin/jobs/run:
 *   post:
 *     summary: Run a specific job manually
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobType
 *               - jobName
 *             properties:
 *               jobType:
 *                 type: string
 *                 enum: [reminder, analytics]
 *                 description: Type of job to run
 *               jobName:
 *                 type: string
 *                 description: Specific job name to execute
 *     responses:
 *       200:
 *         description: Job executed successfully
 *       400:
 *         description: Invalid job type or name
 */
router.post('/jobs/run', auth, requireAdmin, async (req, res) => {
  try {
    const { jobType, jobName } = req.body;

    if (!jobType || !jobName) {
      return res.status(400).json({
        success: false,
        error: 'jobType and jobName are required'
      });
    }

    await jobManager.runJob(jobType, jobName);
    
    logger.info(`Manual job execution: ${jobType}.${jobName} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: `Job ${jobType}.${jobName} executed successfully`
    });
  } catch (error) {
    logger.error('Error running job:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/jobs/restart:
 *   post:
 *     summary: Restart a specific job type
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobType
 *             properties:
 *               jobType:
 *                 type: string
 *                 enum: [reminder, analytics]
 *                 description: Type of job to restart
 *     responses:
 *       200:
 *         description: Job type restarted successfully
 *       400:
 *         description: Invalid job type
 */
router.post('/jobs/restart', auth, requireAdmin, async (req, res) => {
  try {
    const { jobType } = req.body;

    if (!jobType) {
      return res.status(400).json({
        success: false,
        error: 'jobType is required'
      });
    }

    await jobManager.restartJobType(jobType);
    
    logger.info(`Job type restart: ${jobType} by user ${req.user.email}`);
    
    res.json({
      success: true,
      message: `Job type ${jobType} restarted successfully`
    });
  } catch (error) {
    logger.error('Error restarting job type:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/jobs/schedule:
 *   post:
 *     summary: Schedule a one-time job execution
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobType
 *               - jobName
 *             properties:
 *               jobType:
 *                 type: string
 *                 enum: [reminder, analytics]
 *               jobName:
 *                 type: string
 *               delayMs:
 *                 type: integer
 *                 description: Delay in milliseconds (default: 0)
 *     responses:
 *       200:
 *         description: Job scheduled successfully
 */
router.post('/jobs/schedule', auth, requireAdmin, async (req, res) => {
  try {
    const { jobType, jobName, delayMs = 0 } = req.body;

    if (!jobType || !jobName) {
      return res.status(400).json({
        success: false,
        error: 'jobType and jobName are required'
      });
    }

    const result = await jobManager.scheduleOneTimeJob(jobType, jobName, delayMs);
    
    logger.info(`Job scheduled: ${jobType}.${jobName} with ${delayMs}ms delay by user ${req.user.email}`);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error scheduling job:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/system/info:
 *   get:
 *     summary: Get system information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System information retrieved successfully
 */
router.get('/system/info', auth, requireAdmin, (req, res) => {
  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    data: systemInfo
  });
});

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get recent application logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Log level filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of log entries to return
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 */
router.get('/logs', auth, requireAdmin, async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    
    // In a real implementation, you would query your logging system
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Log retrieval not implemented yet',
      data: {
        level,
        limit: parseInt(limit),
        logs: []
      }
    });
  } catch (error) {
    logger.error('Error retrieving logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs'
    });
  }
});

module.exports = router;
