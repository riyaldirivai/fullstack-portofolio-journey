/**
 * Analytics Service
 * Handles data analysis, reporting, and insights generation
 */

const logger = require('../utils/logger');
const Timer = require('../models/Timer');
const TimerSession = require('../models/TimerSession');
const Goal = require('../models/Goal');
const User = require('../models/User');

class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize analytics service
   */
  async initialize() {
    try {
      logger.info('📊 Initializing Analytics Service...');
      
      // Set up periodic cache cleanup
      this.setupCacheCleanup();
      
      this.isInitialized = true;
      logger.info('✅ Analytics Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Analytics Service:', error);
      throw error;
    }
  }

  /**
   * Set up periodic cache cleanup
   */
  setupCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, this.cacheTimeout);
  }

  /**
   * Get cached result or execute function and cache result
   */
  async getCachedResult(key, fn, ttl = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const result = await fn();
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Get user dashboard analytics
   */
  async getDashboardAnalytics(userId) {
    const cacheKey = `dashboard:${userId}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get timer sessions
      const timerSessions = await TimerSession.find({ 
        userId,
        status: 'completed'
      }).sort({ createdAt: -1 });

      // Get goals
      const goals = await Goal.find({ userId });

      // Calculate today's stats
      const todaySessions = timerSessions.filter(session => 
        new Date(session.createdAt) >= today
      );

      const todayStats = {
        totalFocusTime: this.calculateTotalFocusTime(todaySessions),
        completedSessions: todaySessions.length,
        focusTimeTrend: await this.calculateTrend(userId, 'focusTime', 'day'),
        sessionsTrend: await this.calculateTrend(userId, 'sessions', 'day')
      };

      // Calculate weekly stats
      const weekSessions = timerSessions.filter(session => 
        new Date(session.createdAt) >= thisWeek
      );

      const weeklyStats = {
        totalFocusTime: this.calculateTotalFocusTime(weekSessions),
        totalSessions: weekSessions.length,
        avgDailyFocus: this.calculateTotalFocusTime(weekSessions) / 7,
        currentStreak: await this.calculateStreakDays(userId),
        bestDay: await this.getBestDayOfWeek(userId)
      };

      // Calculate monthly stats
      const monthSessions = timerSessions.filter(session => 
        new Date(session.createdAt) >= thisMonth
      );

      const monthlyStats = {
        totalFocusTime: this.calculateTotalFocusTime(monthSessions),
        totalSessions: monthSessions.length,
        completedGoals: goals.filter(goal => 
          goal.status === 'completed' && 
          new Date(goal.completedAt) >= thisMonth
        ).length,
        avgDailyFocus: this.calculateTotalFocusTime(monthSessions) / now.getDate()
      };

      return {
        todayStats,
        weeklyStats,
        monthlyStats
      };
    });
  }

  /**
   * Get timer analytics for user
   */
  async getTimerAnalytics(userId, period = 'week') {
    const cacheKey = `timer:${userId}:${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const dateRange = this.getDateRange(period);
      
      const sessions = await TimerSession.find({
        userId,
        createdAt: { $gte: dateRange.start },
        status: 'completed'
      }).sort({ createdAt: -1 });

      // Group sessions by day
      const sessionsByDay = this.groupSessionsByDay(sessions);
      
      // Calculate productivity patterns
      const productivityPatterns = this.analyzeProductivityPatterns(sessions);
      
      // Calculate focus session stats
      const focusStats = this.calculateFocusStats(sessions);
      
      // Calculate most productive times
      const productiveTimes = this.analyzeProductiveTimes(sessions);

      return {
        totalSessions: sessions.length,
        totalFocusTime: this.calculateTotalFocusTime(sessions),
        avgSessionLength: this.calculateAverageSessionLength(sessions),
        completionRate: this.calculateCompletionRate(userId, dateRange),
        sessionsByDay,
        productivityPatterns,
        focusStats,
        productiveTimes,
        topTasks: await this.getTopTasks(userId, dateRange),
        modeUsage: this.analyzeModeUsage(sessions)
      };
    });
  }

  /**
   * Get goal analytics for user
   */
  async getGoalAnalytics(userId, period = 'month') {
    const cacheKey = `goals:${userId}:${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const dateRange = this.getDateRange(period);
      
      const goals = await Goal.find({
        userId,
        createdAt: { $gte: dateRange.start }
      });

      // Calculate completion stats
      const completionStats = this.calculateGoalCompletionStats(goals);
      
      // Analyze goal categories
      const categoryStats = this.analyzeGoalCategories(goals);
      
      // Calculate progress trends
      const progressTrends = this.analyzeGoalProgressTrends(goals);
      
      // Get upcoming deadlines
      const upcomingDeadlines = this.getUpcomingDeadlines(goals);

      return {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        overdueGoals: goals.filter(g => 
          g.status === 'active' && new Date(g.dueDate) < new Date()
        ).length,
        completionStats,
        categoryStats,
        progressTrends,
        upcomingDeadlines,
        avgCompletionTime: this.calculateAverageCompletionTime(goals),
        successRate: this.calculateSuccessRate(goals)
      };
    });
  }

  /**
   * Get comprehensive user report
   */
  async getUserReport(userId, period = 'week') {
    const cacheKey = `report:${userId}:${period}`;
    
    return this.getCachedResult(cacheKey, async () => {
      const [dashboardAnalytics, timerAnalytics, goalAnalytics] = await Promise.all([
        this.getDashboardAnalytics(userId),
        this.getTimerAnalytics(userId, period),
        this.getGoalAnalytics(userId, period)
      ]);

      // Calculate overall productivity score
      const productivityScore = this.calculateProductivityScore({
        timer: timerAnalytics,
        goals: goalAnalytics
      });

      // Generate insights and recommendations
      const insights = this.generateInsights({
        dashboard: dashboardAnalytics,
        timer: timerAnalytics,
        goals: goalAnalytics,
        productivityScore
      });

      return {
        period,
        generatedAt: new Date().toISOString(),
        dashboardAnalytics,
        timerAnalytics,
        goalAnalytics,
        productivityScore,
        insights
      };
    });
  }

  /**
   * Calculate total focus time from sessions
   */
  calculateTotalFocusTime(sessions) {
    return sessions.reduce((total, session) => {
      return total + (session.actualDuration || session.duration || 0);
    }, 0);
  }

  /**
   * Calculate average session length
   */
  calculateAverageSessionLength(sessions) {
    if (sessions.length === 0) return 0;
    return this.calculateTotalFocusTime(sessions) / sessions.length;
  }

  /**
   * Calculate completion rate
   */
  async calculateCompletionRate(userId, dateRange) {
    const totalSessions = await TimerSession.countDocuments({
      userId,
      createdAt: { $gte: dateRange.start }
    });

    const completedSessions = await TimerSession.countDocuments({
      userId,
      createdAt: { $gte: dateRange.start },
      status: 'completed'
    });

    return totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
  }

  /**
   * Group sessions by day
   */
  groupSessionsByDay(sessions) {
    const grouped = {};
    
    sessions.forEach(session => {
      const day = new Date(session.createdAt).toISOString().split('T')[0];
      if (!grouped[day]) {
        grouped[day] = {
          date: day,
          sessions: 0,
          focusTime: 0,
          avgSession: 0
        };
      }
      
      grouped[day].sessions += 1;
      grouped[day].focusTime += session.actualDuration || session.duration || 0;
      grouped[day].avgSession = grouped[day].focusTime / grouped[day].sessions;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  /**
   * Analyze productivity patterns
   */
  analyzeProductivityPatterns(sessions) {
    const patterns = {
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      weekly: {}
    };

    sessions.forEach(session => {
      const date = new Date(session.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      
      patterns.hourly[hour] += session.actualDuration || session.duration || 0;
      patterns.daily[day] += session.actualDuration || session.duration || 0;
    });

    return patterns;
  }

  /**
   * Analyze productive times
   */
  analyzeProductiveTimes(sessions) {
    const timeSlots = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-17
      evening: 0,   // 17-22
      night: 0      // 22-6
    };

    sessions.forEach(session => {
      const hour = new Date(session.createdAt).getHours();
      const duration = session.actualDuration || session.duration || 0;
      
      if (hour >= 6 && hour < 12) {
        timeSlots.morning += duration;
      } else if (hour >= 12 && hour < 17) {
        timeSlots.afternoon += duration;
      } else if (hour >= 17 && hour < 22) {
        timeSlots.evening += duration;
      } else {
        timeSlots.night += duration;
      }
    });

    return timeSlots;
  }

  /**
   * Calculate focus stats
   */
  calculateFocusStats(sessions) {
    const focusSessions = sessions.filter(s => s.type === 'focus' || s.mode === 'focus');
    const pomodoroSessions = sessions.filter(s => s.mode === 'pomodoro');
    const breakSessions = sessions.filter(s => s.type === 'break');

    return {
      focusSessions: focusSessions.length,
      pomodoroSessions: pomodoroSessions.length,
      breakSessions: breakSessions.length,
      avgFocusLength: this.calculateAverageSessionLength(focusSessions),
      longestSession: Math.max(...sessions.map(s => s.actualDuration || s.duration || 0), 0),
      shortestSession: Math.min(...sessions.map(s => s.actualDuration || s.duration || 0), 0)
    };
  }

  /**
   * Get top tasks
   */
  async getTopTasks(userId, dateRange) {
    const sessions = await TimerSession.find({
      userId,
      createdAt: { $gte: dateRange.start },
      status: 'completed',
      description: { $exists: true, $ne: '' }
    });

    const taskStats = {};
    
    sessions.forEach(session => {
      const task = session.description.toLowerCase().trim();
      if (!taskStats[task]) {
        taskStats[task] = {
          name: session.description,
          sessions: 0,
          totalTime: 0
        };
      }
      
      taskStats[task].sessions += 1;
      taskStats[task].totalTime += session.actualDuration || session.duration || 0;
    });

    return Object.values(taskStats)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5);
  }

  /**
   * Analyze mode usage
   */
  analyzeModeUsage(sessions) {
    const modeStats = {};
    
    sessions.forEach(session => {
      const mode = session.mode || 'custom';
      if (!modeStats[mode]) {
        modeStats[mode] = {
          count: 0,
          totalTime: 0,
          avgTime: 0
        };
      }
      
      modeStats[mode].count += 1;
      modeStats[mode].totalTime += session.actualDuration || session.duration || 0;
      modeStats[mode].avgTime = modeStats[mode].totalTime / modeStats[mode].count;
    });

    return modeStats;
  }

  /**
   * Calculate goal completion stats
   */
  calculateGoalCompletionStats(goals) {
    const stats = {
      byPriority: { high: 0, medium: 0, low: 0 },
      byCategory: {},
      byMonth: {}
    };

    goals.filter(g => g.status === 'completed').forEach(goal => {
      // By priority
      stats.byPriority[goal.priority] += 1;
      
      // By category
      const category = goal.category || 'other';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // By month
      const month = new Date(goal.completedAt).toISOString().substring(0, 7);
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    return stats;
  }

  /**
   * Analyze goal categories
   */
  analyzeGoalCategories(goals) {
    const categoryStats = {};
    
    goals.forEach(goal => {
      const category = goal.category || 'other';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          completed: 0,
          active: 0,
          overdue: 0
        };
      }
      
      categoryStats[category].total += 1;
      
      if (goal.status === 'completed') {
        categoryStats[category].completed += 1;
      } else if (goal.status === 'active') {
        categoryStats[category].active += 1;
        
        if (new Date(goal.dueDate) < new Date()) {
          categoryStats[category].overdue += 1;
        }
      }
    });

    return categoryStats;
  }

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines(goals) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return goals
      .filter(goal => 
        goal.status === 'active' && 
        new Date(goal.dueDate) >= now &&
        new Date(goal.dueDate) <= in7Days
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }

  /**
   * Calculate productivity score
   */
  calculateProductivityScore(data) {
    const timerScore = this.calculateTimerScore(data.timer);
    const goalScore = this.calculateGoalScore(data.goals);
    
    const overallScore = Math.round((timerScore + goalScore) / 2);
    
    return {
      overall: overallScore,
      timer: timerScore,
      goals: goalScore,
      rating: this.getScoreRating(overallScore)
    };
  }

  /**
   * Calculate timer score (0-100)
   */
  calculateTimerScore(timerData) {
    let score = 0;
    
    // Base score from sessions completed
    score += Math.min(timerData.totalSessions * 5, 30);
    
    // Bonus for consistency (sessions per day)
    const avgSessionsPerDay = timerData.totalSessions / 7;
    score += Math.min(avgSessionsPerDay * 10, 20);
    
    // Bonus for focus time
    const focusTimeHours = timerData.totalFocusTime / 60;
    score += Math.min(focusTimeHours * 2, 25);
    
    // Bonus for completion rate
    score += (timerData.completionRate * 0.25);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate goal score (0-100)
   */
  calculateGoalScore(goalData) {
    let score = 0;
    
    if (goalData.totalGoals === 0) return 0;
    
    // Base score from completion rate
    const completionRate = (goalData.completedGoals / goalData.totalGoals) * 100;
    score += completionRate * 0.6;
    
    // Penalty for overdue goals
    const overdueRate = (goalData.overdueGoals / goalData.totalGoals) * 100;
    score -= overdueRate * 0.3;
    
    // Bonus for having goals
    score += Math.min(goalData.totalGoals * 2, 20);
    
    // Bonus for success rate
    score += (goalData.successRate * 0.2);
    
    return Math.max(0, Math.min(Math.round(score), 100));
  }

  /**
   * Get score rating
   */
  getScoreRating(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Generate insights and recommendations
   */
  generateInsights(data) {
    const insights = [];
    
    // Timer insights
    if (data.timer.totalSessions === 0) {
      insights.push({
        type: 'timer',
        category: 'getting-started',
        message: 'Start your productivity journey by completing your first timer session!',
        action: 'Try a 25-minute Pomodoro session'
      });
    } else if (data.timer.completionRate < 70) {
      insights.push({
        type: 'timer',
        category: 'improvement',
        message: 'Your session completion rate could be improved. Try shorter sessions to build consistency.',
        action: 'Start with 15-minute sessions'
      });
    }
    
    // Goal insights
    if (data.goals.overdueGoals > 0) {
      insights.push({
        type: 'goals',
        category: 'urgent',
        message: `You have ${data.goals.overdueGoals} overdue goals. Consider breaking them into smaller tasks.`,
        action: 'Review and update overdue goals'
      });
    }
    
    // Productivity insights
    if (data.productivityScore.overall >= 80) {
      insights.push({
        type: 'achievement',
        category: 'celebration',
        message: 'Excellent productivity! You\'re maintaining great habits.',
        action: 'Keep up the great work!'
      });
    }

    return insights;
  }

  /**
   * Get date range based on period
   */
  getDateRange(period) {
    const now = new Date();
    let start;

    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { start, end: now };
  }

  /**
   * Calculate trend (placeholder - would need historical data)
   */
  async calculateTrend(userId, metric, period) {
    // This is a simplified version - in production you'd compare with previous periods
    return Math.random() > 0.5 ? 'up' : 'down';
  }

  /**
   * Calculate streak days
   */
  async calculateStreakDays(userId) {
    const sessions = await TimerSession.find({
      userId,
      status: 'completed'
    }).sort({ createdAt: -1 });

    if (sessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sessionDates = new Set();
    sessions.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      sessionDate.setHours(0, 0, 0, 0);
      sessionDates.add(sessionDate.getTime());
    });

    while (sessionDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }

  /**
   * Get best day of week
   */
  async getBestDayOfWeek(userId) {
    const sessions = await TimerSession.find({
      userId,
      status: 'completed'
    });

    const dayStats = new Array(7).fill(0);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    sessions.forEach(session => {
      const day = new Date(session.createdAt).getDay();
      dayStats[day] += session.actualDuration || session.duration || 0;
    });

    const bestDayIndex = dayStats.indexOf(Math.max(...dayStats));
    return dayNames[bestDayIndex];
  }

  /**
   * Calculate average completion time for goals
   */
  calculateAverageCompletionTime(goals) {
    const completedGoals = goals.filter(g => g.status === 'completed' && g.completedAt);
    
    if (completedGoals.length === 0) return 0;

    const totalTime = completedGoals.reduce((sum, goal) => {
      const created = new Date(goal.createdAt);
      const completed = new Date(goal.completedAt);
      return sum + (completed - created);
    }, 0);

    return Math.round(totalTime / completedGoals.length / (24 * 60 * 60 * 1000)); // Days
  }

  /**
   * Calculate success rate for goals
   */
  calculateSuccessRate(goals) {
    if (goals.length === 0) return 0;
    
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    return Math.round((completedGoals / goals.length) * 100);
  }

  /**
   * Analyze goal progress trends
   */
  analyzeGoalProgressTrends(goals) {
    // This would analyze progress over time - simplified for now
    const activeGoals = goals.filter(g => g.status === 'active');
    const avgProgress = activeGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / activeGoals.length;
    
    return {
      averageProgress: Math.round(avgProgress || 0),
      onTrackGoals: activeGoals.filter(g => (g.progress || 0) >= 50).length,
      behindSchedule: activeGoals.filter(g => (g.progress || 0) < 25).length
    };
  }
}

module.exports = new AnalyticsService();
