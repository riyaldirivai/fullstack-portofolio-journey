const express = require("express");
const router = express.Router();
const timerController = require("../controllers/timerController");
const {
  authenticateToken,
  requireActiveAccount,
} = require("../middleware/auth");
const { timerRateLimit } = require("../middleware/rateLimiter");
const {
  validate,
  timerValidationRules,
  paramValidationRules,
  queryValidationRules,
} = require("../utils/validators");
const {
  sanitizeInput,
  validateObjectIdParams,
} = require("../middleware/validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     TimerSession:
 *       type: object
 *       required:
 *         - type
 *         - duration
 *       properties:
 *         id:
 *           type: string
 *           description: Timer session ID
 *         type:
 *           type: string
 *           enum: [pomodoro, focus, break, longbreak]
 *           description: Type of timer session
 *         taskName:
 *           type: string
 *           description: Name of the task being worked on
 *         duration:
 *           type: number
 *           description: Planned duration in milliseconds
 *         elapsedTime:
 *           type: number
 *           description: Actual elapsed time in milliseconds
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [active, paused, completed, cancelled]
 *         goalId:
 *           type: string
 *           description: Associated goal ID
 *         notes:
 *           type: string
 *           description: Session notes
 *         productivity:
 *           type: object
 *           properties:
 *             rating:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *             feedback:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(requireActiveAccount);
router.use(timerRateLimit);

/**
 * @swagger
 * /api/timer/start:
 *   post:
 *     summary: Start a new timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - duration
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [pomodoro, focus, break, longbreak]
 *               duration:
 *                 type: number
 *                 description: Duration in milliseconds
 *               goalId:
 *                 type: string
 *                 description: Associated goal ID
 *               taskName:
 *                 type: string
 *                 description: Task being worked on
 *     responses:
 *       201:
 *         description: Timer started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimerSession'
 *       400:
 *         description: Validation error or active session exists
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/start",
  sanitizeInput,
  validate(timerValidationRules.start),
  timerController.startTimer
);

/**
 * @swagger
 * /api/timer/active:
 *   get:
 *     summary: Get active timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active timer session retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimerSession'
 *       404:
 *         description: No active timer session
 *       401:
 *         description: Unauthorized
 */
router.get("/active", timerController.getActiveTimer);

/**
 * @swagger
 * /api/timer/{id}/pause:
 *   patch:
 *     summary: Pause an active timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timer session ID
 *     responses:
 *       200:
 *         description: Timer paused successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimerSession'
 *       404:
 *         description: Timer session not found
 *       400:
 *         description: Timer not in active state
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/pause",
  validateObjectIdParams(["id"]),
  validate(paramValidationRules.objectId),
  timerController.pauseTimer
);

/**
 * @swagger
 * /api/timer/{id}/resume:
 *   patch:
 *     summary: Resume a paused timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timer session ID
 *     responses:
 *       200:
 *         description: Timer resumed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimerSession'
 *       404:
 *         description: Timer session not found
 *       400:
 *         description: Timer not in paused state
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/resume",
  validateObjectIdParams(["id"]),
  validate(paramValidationRules.objectId),
  timerController.resumeTimer
);

/**
 * @swagger
 * /api/timer/{id}/complete:
 *   patch:
 *     summary: Complete a timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timer session ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Session notes
 *               productivity:
 *                 type: object
 *                 properties:
 *                   rating:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 5
 *                   feedback:
 *                     type: string
 *     responses:
 *       200:
 *         description: Timer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/TimerSession'
 *       404:
 *         description: Timer session not found
 *       400:
 *         description: Timer not in active/paused state
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/complete",
  validateObjectIdParams(["id"]),
  sanitizeInput,
  validate([
    ...paramValidationRules.objectId,
    require("express-validator")
      .body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters"),
    require("express-validator")
      .body("productivity.rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    require("express-validator")
      .body("productivity.feedback")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Feedback cannot exceed 200 characters"),
  ]),
  timerController.completeTimer
);

/**
 * @swagger
 * /api/timer/{id}/cancel:
 *   patch:
 *     summary: Cancel a timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timer session ID
 *     responses:
 *       200:
 *         description: Timer cancelled successfully
 *       404:
 *         description: Timer session not found
 *       400:
 *         description: Timer not in active/paused state
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/cancel",
  validateObjectIdParams(["id"]),
  validate(paramValidationRules.objectId),
  timerController.cancelTimer
);

/**
 * @swagger
 * /api/timer/history:
 *   get:
 *     summary: Get timer session history
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [pomodoro, focus, break, longbreak]
 *         description: Filter by timer type
 *       - in: query
 *         name: goalId
 *         schema:
 *           type: string
 *         description: Filter by goal ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: Timer history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimerSession'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/history",
  sanitizeInput,
  validate([
    ...queryValidationRules.pagination,
    ...queryValidationRules.dateRange,
  ]),
  timerController.getTimerHistory
);

/**
 * @swagger
 * /api/timer/stats:
 *   get:
 *     summary: Get timer statistics
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Statistics to date
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         description: Period in days (alternative to date range)
 *     responses:
 *       200:
 *         description: Timer statistics retrieved successfully
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
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           totalSessions:
 *                             type: number
 *                           totalTime:
 *                             type: number
 *                           averageTime:
 *                             type: number
 *                     total:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: number
 *                         totalTime:
 *                           type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/stats",
  sanitizeInput,
  validate([
    ...queryValidationRules.dateRange,
    ...queryValidationRules.analytics,
  ]),
  timerController.getTimerStats
);

/**
 * @swagger
 * /api/timer/{id}/interruption:
 *   post:
 *     summary: Add interruption to timer session
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Timer session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - duration
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for interruption
 *               duration:
 *                 type: number
 *                 description: Duration of interruption in milliseconds
 *     responses:
 *       200:
 *         description: Interruption added successfully
 *       404:
 *         description: Timer session not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:id/interruption",
  validateObjectIdParams(["id"]),
  sanitizeInput,
  validate([
    ...paramValidationRules.objectId,
    require("express-validator")
      .body("reason")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Reason must be between 1 and 100 characters"),
    require("express-validator")
      .body("duration")
      .isInt({ min: 1000 }) // minimum 1 second
      .withMessage("Duration must be at least 1000 milliseconds"),
  ]),
  timerController.addInterruption
);

/**
 * @swagger
 * /api/timer/presets:
 *   get:
 *     summary: Get timer presets/defaults
 *     tags: [Timer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Timer presets retrieved successfully
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
 *                     pomodoro:
 *                       type: number
 *                     focus:
 *                       type: number
 *                     break:
 *                       type: number
 *                     longbreak:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/presets", timerController.getTimerPresets);

module.exports = router;
