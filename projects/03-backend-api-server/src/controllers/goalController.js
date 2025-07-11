/**
 * Goal Controller
 * Handles CRUD operations for goals and sub-goals
 */

const Goal = require('../models/Goal');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// Get all goals for a user
const getGoals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { 
    status, 
    category, 
    priority,
    page = 1, 
    limit = 10, 
    sort = '-createdAt',
    search
  } = req.query;

  // Build filter object
  const filter = { userId };
  
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get goals with pagination
  const [goals, total] = await Promise.all([
    Goal.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'firstName lastName email'),
    Goal.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.status(200).json({
    success: true,
    data: {
      goals,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalGoals: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      }
    }
  });
});

// Get a single goal by ID
const getGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId })
    .populate('userId', 'firstName lastName email');

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { goal }
  });
});

// Create a new goal
const createGoal = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const goalData = { ...req.body, userId };

  // Create goal
  const goal = await Goal.create(goalData);

  // Update user stats
  const user = req.user;
  user.updateStats({
    totalGoalsCreated: user.stats.totalGoalsCreated + 1
  });
  await user.save();

  logger.info(`New goal created: ${goal.title} by user: ${user.email}`);

  // Populate user info for response
  await goal.populate('userId', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: { goal }
  });
});

// Update a goal
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updates = req.body;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Check if goal is being marked as completed
  const wasCompleted = goal.status === 'completed';
  const isBeingCompleted = updates.status === 'completed' || updates.progress === 100;

  // Update goal
  Object.assign(goal, updates);
  await goal.save();

  // Update user stats if goal was completed
  if (!wasCompleted && isBeingCompleted) {
    const user = req.user;
    user.updateStats({
      totalGoalsCompleted: user.stats.totalGoalsCompleted + 1
    });
    await user.save();

    logger.info(`Goal completed: ${goal.title} by user: ${user.email}`);
  }

  await goal.populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Goal updated successfully',
    data: { goal }
  });
});

// Delete a goal
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  await Goal.findByIdAndDelete(id);

  logger.info(`Goal deleted: ${goal.title} by user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Goal deleted successfully'
  });
});

// Mark goal as completed
const completeGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  if (goal.status === 'completed') {
    throw new AppError('Goal is already completed', 400, 'GOAL_ALREADY_COMPLETED');
  }

  // Mark as completed
  goal.markCompleted();
  await goal.save();

  // Update user stats
  const user = req.user;
  user.updateStats({
    totalGoalsCompleted: user.stats.totalGoalsCompleted + 1
  });
  await user.save();

  logger.info(`Goal completed: ${goal.title} by user: ${user.email}`);

  await goal.populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Goal marked as completed',
    data: { goal }
  });
});

// Add sub-goal to a goal
const addSubGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Add sub-goal
  goal.addSubGoal(title, description);
  await goal.save();

  await goal.populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Sub-goal added successfully',
    data: { goal }
  });
});

// Toggle sub-goal completion
const toggleSubGoal = asyncHandler(async (req, res) => {
  const { id, subGoalId } = req.params;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  const subGoal = goal.subGoals.id(subGoalId);
  if (!subGoal) {
    throw new AppError('Sub-goal not found', 404, 'SUBGOAL_NOT_FOUND');
  }

  // Toggle sub-goal
  goal.toggleSubGoal(subGoalId);
  await goal.save();

  await goal.populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: `Sub-goal ${subGoal.completed ? 'completed' : 'uncompleted'}`,
    data: { goal }
  });
});

// Add time session to goal
const addTimeSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime, notes } = req.body;
  const userId = req.user._id;

  const goal = await Goal.findOne({ _id: id, userId });

  if (!goal) {
    throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
  }

  // Validate time session
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    throw new AppError('End time must be after start time', 400, 'INVALID_TIME_RANGE');
  }

  if (end > new Date()) {
    throw new AppError('End time cannot be in the future', 400, 'FUTURE_END_TIME');
  }

  // Add time session
  goal.addTimeSession(startTime, endTime, notes);
  await goal.save();

  // Update user stats
  const duration = Math.round((end - start) / (1000 * 60)); // in minutes
  const user = req.user;
  user.updateStats({
    totalTimeTracked: user.stats.totalTimeTracked + duration
  });
  await user.save();

  await goal.populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    message: 'Time session added successfully',
    data: { goal }
  });
});

// Get goals by category
const getGoalsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const userId = req.user._id;

  const goals = await Goal.findByCategory(userId, category)
    .sort('-createdAt')
    .populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: {
      category,
      goals,
      count: goals.length
    }
  });
});

// Get overdue goals
const getOverdueGoals = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const overdueGoals = await Goal.findOverdueGoals(userId)
    .sort('deadlineDate')
    .populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: {
      overdueGoals,
      count: overdueGoals.length
    }
  });
});

// Get goal statistics
const getGoalStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const stats = await Goal.getUserStats(userId);

  // Get additional breakdowns
  const [categoryStats, statusStats, priorityStats] = await Promise.all([
    Goal.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Goal.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Goal.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ])
  ]);

  res.status(200).json({
    success: true,
    data: {
      overall: stats,
      breakdown: {
        byCategory: categoryStats,
        byStatus: statusStats,
        byPriority: priorityStats
      }
    }
  });
});

// Search goals
const searchGoals = asyncHandler(async (req, res) => {
  const { q, category, status, priority } = req.query;
  const userId = req.user._id;

  if (!q || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400, 'INVALID_SEARCH_QUERY');
  }

  // Build search filter
  const filter = {
    userId,
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
      { notes: { $regex: q, $options: 'i' } }
    ]
  };

  if (category) filter.category = category;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const goals = await Goal.find(filter)
    .sort('-createdAt')
    .limit(20)
    .populate('userId', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: {
      searchQuery: q,
      goals,
      count: goals.length
    }
  });
});

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  addSubGoal,
  toggleSubGoal,
  addTimeSession,
  getGoalsByCategory,
  getOverdueGoals,
  getGoalStats,
  searchGoals
};
