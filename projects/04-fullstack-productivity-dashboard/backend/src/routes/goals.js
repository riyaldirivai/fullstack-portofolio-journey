const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalController");
const {
  authenticateToken,
  requireActiveAccount,
} = require("../middleware/auth");
const { goalRateLimit } = require("../middleware/rateLimiter");
const {
  validate,
  goalValidationRules,
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
 *     Goal:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - targetValue
 *         - unit
 *       properties:
 *         id:
 *           type: string
 *           description: Goal ID
 *         title:
 *           type: string
 *           description: Goal title
 *         description:
 *           type: string
 *           description: Goal description
 *         category:
 *           type: string
 *           description: Category ID
 *         targetValue:
 *           type: number
 *           description: Target value to achieve
 *         currentValue:
 *           type: number
 *           description: Current progress value
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         status:
 *           type: string
 *           enum: [active, completed, paused, cancelled]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         deadline:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         progressPercentage:
 *           type: number
 *           description: Calculated progress percentage
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Apply authentication and rate limiting to all routes
router.use(authenticateToken);
router.use(requireActiveAccount);
router.use(goalRateLimit);

/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Get all goals for authenticated user
 *     tags: [Goals]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused, cancelled]
 *         description: Filter by goal status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
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
 *                     $ref: '#/components/schemas/Goal'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  sanitizeInput,
  validate(queryValidationRules.pagination),
  goalController.getGoals
);

/**
 * @swagger
 * /api/goals/{id}:
 *   get:
 *     summary: Get a specific goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Goal not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/:id",
  validateObjectIdParams(["id"]),
  validate(paramValidationRules.objectId),
  goalController.getGoal
);

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - targetValue
 *               - unit
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               unit:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Goal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Goal'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  sanitizeInput,
  validate(goalValidationRules.create),
  goalController.createGoal
);

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Update a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               targetValue:
 *                 type: number
 *               currentValue:
 *                 type: number
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Goal updated successfully
 *       404:
 *         description: Goal not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/:id",
  validateObjectIdParams(["id"]),
  sanitizeInput,
  validate([...paramValidationRules.objectId, ...goalValidationRules.update]),
  goalController.updateGoal
);

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Delete a goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     responses:
 *       200:
 *         description: Goal deleted successfully
 *       404:
 *         description: Goal not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:id",
  validateObjectIdParams(["id"]),
  validate(paramValidationRules.objectId),
  goalController.deleteGoal
);

/**
 * @swagger
 * /api/goals/{id}/progress:
 *   patch:
 *     summary: Update goal progress
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentValue
 *             properties:
 *               currentValue:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       404:
 *         description: Goal not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/progress",
  validateObjectIdParams(["id"]),
  sanitizeInput,
  validate([
    ...paramValidationRules.objectId,
    ...goalValidationRules.updateProgress,
  ]),
  goalController.updateProgress
);

/**
 * @swagger
 * /api/goals/stats:
 *   get:
 *     summary: Get goal statistics for user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Goal statistics retrieved successfully
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
 *                     totalGoals:
 *                       type: number
 *                     completedGoals:
 *                       type: number
 *                     activeGoals:
 *                       type: number
 *                     completionRate:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get("/stats", goalController.getGoalStats);

/**
 * @swagger
 * /api/goals/{id}/milestones:
 *   post:
 *     summary: Add milestone to goal
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Goal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - targetValue
 *             properties:
 *               title:
 *                 type: string
 *               targetValue:
 *                 type: number
 *     responses:
 *       200:
 *         description: Milestone added successfully
 *       404:
 *         description: Goal not found
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:id/milestones",
  validateObjectIdParams(["id"]),
  sanitizeInput,
  validate([
    ...paramValidationRules.objectId,
    require("express-validator")
      .body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be between 1 and 100 characters"),
    require("express-validator")
      .body("targetValue")
      .isFloat({ min: 0.1 })
      .withMessage("Target value must be a positive number"),
  ]),
  goalController.addMilestone
);

/**
 * @swagger
 * /api/goals/overdue:
 *   get:
 *     summary: Get overdue goals for user
 *     tags: [Goals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue goals retrieved successfully
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
 *                     $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Unauthorized
 */
router.get("/overdue", goalController.getOverdueGoals);

module.exports = router;
