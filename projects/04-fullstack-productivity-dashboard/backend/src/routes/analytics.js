const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const {
  authenticateToken,
  requireActiveAccount,
  requireAdminRole,
} = require("../middleware/auth");
const { analyticsRateLimit } = require("../middleware/rateLimiter");
const { validate, queryValidationRules } = require("../utils/validators");
const { sanitizeInput } = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     Analytics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalSessions:
 *               type: number
 *             totalTime:
 *               type: number
 *             goalsCompleted:
 *               type: number
 *             productivity:
 *               type: object
 *               properties:
 *                 average:
 *                   type: number
 *                 trend:
 *                   type: string
 *                   enum: [up, down, stable]
 *         timeDistribution:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *               value:
 *                 type: number
 *         productivity:
 *           type: object
 *           properties:
 *             daily:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   sessions:
 *                     type: number
 *                   time:
 *                     type: number
 *                   rating:
 *                     type: number
 *         goals:
 *           type: object
 *           properties:
 *             completion:
 *               type: object
 *               properties:
 *                 completed:
 *                   type: number
 *                 inProgress:
 *                   type: number
 *                 total:
 *                   type: number
 *             byCategory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   count:
 *                     type: number
 */

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(requireActiveAccount);
router.use(analyticsRateLimit);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics (default 30)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Analytics'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/dashboard",
  sanitizeInput,
  validate([
    ...queryValidationRules.dateRange,
    ...queryValidationRules.analytics,
  ]),
  analyticsController.getDashboardAnalytics
);

/**
 * @swagger
 * /api/analytics/productivity:
 *   get:
 *     summary: Get productivity analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *         description: Group data by time period
 *       - in: query
 *         name: includeRating
 *         schema:
 *           type: boolean
 *         description: Include productivity ratings
 *     responses:
 *       200:
 *         description: Productivity analytics retrieved successfully
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
 *                     trends:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           sessions:
 *                             type: number
 *                           time:
 *                             type: number
 *                           rating:
 *                             type: number
 *                     summary:
 *                       type: object
 *                       properties:
 *                         average:
 *                           type: number
 *                         trend:
 *                           type: string
 *                         improvement:
 *                           type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/productivity",
  sanitizeInput,
  validate([
    ...queryValidationRules.analytics,
    require("express-validator")
      .query("groupBy")
      .optional()
      .isIn(["day", "week", "month"])
      .withMessage("Group by must be day, week, or month"),
    require("express-validator")
      .query("includeRating")
      .optional()
      .isBoolean()
      .withMessage("Include rating must be a boolean"),
  ]),
  analyticsController.getProductivityAnalytics
);

/**
 * @swagger
 * /api/analytics/goals:
 *   get:
 *     summary: Get goals analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *       - in: query
 *         name: includeCategories
 *         schema:
 *           type: boolean
 *         description: Include category breakdown
 *     responses:
 *       200:
 *         description: Goals analytics retrieved successfully
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
 *                     completion:
 *                       type: object
 *                       properties:
 *                         rate:
 *                           type: number
 *                         completed:
 *                           type: number
 *                         total:
 *                           type: number
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                     trend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           completed:
 *                             type: number
 *                           created:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/goals",
  sanitizeInput,
  validate([
    ...queryValidationRules.analytics,
    require("express-validator")
      .query("includeCategories")
      .optional()
      .isBoolean()
      .withMessage("Include categories must be a boolean"),
  ]),
  analyticsController.getGoalsAnalytics
);

/**
 * @swagger
 * /api/analytics/time:
 *   get:
 *     summary: Get time tracking analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pomodoro, focus, break, longbreak]
 *         description: Filter by timer type
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week]
 *         description: Group data by time period
 *     responses:
 *       200:
 *         description: Time analytics retrieved successfully
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
 *                     distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           total:
 *                             type: number
 *                           byType:
 *                             type: object
 *                     peak:
 *                       type: object
 *                       properties:
 *                         hour:
 *                           type: number
 *                         day:
 *                           type: string
 *                     efficiency:
 *                       type: object
 *                       properties:
 *                         average:
 *                           type: number
 *                         trend:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/time",
  sanitizeInput,
  validate([
    ...queryValidationRules.analytics,
    require("express-validator")
      .query("type")
      .optional()
      .isIn(["pomodoro", "focus", "break", "longbreak"])
      .withMessage("Type must be a valid timer type"),
    require("express-validator")
      .query("groupBy")
      .optional()
      .isIn(["hour", "day", "week"])
      .withMessage("Group by must be hour, day, or week"),
  ]),
  analyticsController.getTimeAnalytics
);

/**
 * @swagger
 * /api/analytics/habits:
 *   get:
 *     summary: Get habit and pattern analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 7
 *           maximum: 365
 *         description: Period in days for analytics (minimum 7)
 *     responses:
 *       200:
 *         description: Habit analytics retrieved successfully
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
 *                     patterns:
 *                       type: object
 *                       properties:
 *                         bestDays:
 *                           type: array
 *                           items:
 *                             type: string
 *                         bestHours:
 *                           type: array
 *                           items:
 *                             type: number
 *                         consistency:
 *                           type: number
 *                     streaks:
 *                       type: object
 *                       properties:
 *                         current:
 *                           type: number
 *                         longest:
 *                           type: number
 *                         average:
 *                           type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/habits",
  sanitizeInput,
  validate([
    require("express-validator")
      .query("period")
      .optional()
      .isInt({ min: 7, max: 365 })
      .withMessage("Period must be between 7 and 365 days"),
  ]),
  analyticsController.getHabitAnalytics
);

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Export format
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for export
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *         description: Comma-separated list of data to include (sessions,goals,productivity)
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/export",
  sanitizeInput,
  validate([
    ...queryValidationRules.analytics,
    require("express-validator")
      .query("format")
      .optional()
      .isIn(["json", "csv"])
      .withMessage("Format must be json or csv"),
    require("express-validator")
      .query("include")
      .optional()
      .matches(
        /^(sessions|goals|productivity)(,(sessions|goals|productivity))*$/
      )
      .withMessage("Include must be comma-separated list of valid data types"),
  ]),
  analyticsController.exportAnalytics
);

// Admin-only analytics routes
/**
 * @swagger
 * /api/analytics/admin/overview:
 *   get:
 *     summary: Get system-wide analytics overview (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *     responses:
 *       200:
 *         description: System analytics retrieved successfully
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
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         active:
 *                           type: number
 *                         new:
 *                           type: number
 *                     sessions:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         completed:
 *                           type: number
 *                         averagePerUser:
 *                           type: number
 *                     goals:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         completed:
 *                           type: number
 *                         completionRate:
 *                           type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  "/admin/overview",
  requireAdminRole,
  sanitizeInput,
  validate(queryValidationRules.analytics),
  analyticsController.getSystemAnalytics
);

/**
 * @swagger
 * /api/analytics/admin/users:
 *   get:
 *     summary: Get user analytics (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days for analytics
 *       - in: query
 *         name: segment
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, new]
 *         description: User segment to analyze
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
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
 *                     growth:
 *                       type: array
 *                       items:
 *                         type: object
 *                     engagement:
 *                       type: object
 *                     retention:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
  "/admin/users",
  requireAdminRole,
  sanitizeInput,
  validate([
    ...queryValidationRules.analytics,
    require("express-validator")
      .query("segment")
      .optional()
      .isIn(["all", "active", "inactive", "new"])
      .withMessage("Segment must be all, active, inactive, or new"),
  ]),
  analyticsController.getUserAnalytics
);

module.exports = router;
