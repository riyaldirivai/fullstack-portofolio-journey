/**
 * Dashboard Routes
 * Handles dashboard analytics and statistics endpoints
 */

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Recent activities
router.get('/recent', dashboardController.getRecentActivities);

// User productivity metrics
router.get('/metrics', dashboardController.getProductivityMetrics);

// Goal progress summary
router.get('/goals-summary', dashboardController.getGoalsSummary);

// Timer statistics
router.get('/timer-stats', dashboardController.getTimerStats);

// Weekly/Monthly reports
router.get('/reports/weekly', dashboardController.getWeeklyReport);
router.get('/reports/monthly', dashboardController.getMonthlyReport);

module.exports = router;
