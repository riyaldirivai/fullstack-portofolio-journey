/**
 * Analytics Job
 * Processes user data and generates analytics insights
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const User = require('../models/User');
const Goal = require('../models/Goal');
const TimerSession = require('../models/TimerSession');
const analyticsService = require('../services/analyticsService');

class AnalyticsJob {
  constructor() {
    this.isRunning = false;
    this.tasks = new Map();
  }

  /**
   * Start all analytics jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('📊 Analytics jobs are already running');
      return;
    }

    logger.info('📊 Starting analytics jobs...');

    // Daily analytics processing - every day at 1 AM
    this.tasks.set('dailyAnalytics', cron.schedule('0 1 * * *', async () => {
      await this.processDailyAnalytics();
    }, { scheduled: false }));

    // Weekly aggregation - every Sunday at 2 AM
    this.tasks.set('weeklyAggregation', cron.schedule('0 2 * * 0', async () => {
      await this.processWeeklyAggregation();
    }, { scheduled: false }));

    // Monthly insights - first day of month at 3 AM
    this.tasks.set('monthlyInsights', cron.schedule('0 3 1 * *', async () => {
      await this.processMonthlyInsights();
    }, { scheduled: false }));

    // User behavior analysis - every 6 hours
    this.tasks.set('userBehavior', cron.schedule('0 */6 * * *', async () => {
      await this.analyzeUserBehavior();
    }, { scheduled: false }));

    // Performance metrics - every hour
    this.tasks.set('performanceMetrics', cron.schedule('0 * * * *', async () => {
      await this.calculatePerformanceMetrics();
    }, { scheduled: false }));

    // Data cleanup - every day at 4 AM
    this.tasks.set('dataCleanup', cron.schedule('0 4 * * *', async () => {
      await this.cleanupOldData();
    }, { scheduled: false }));

    // Start all scheduled tasks
    this.tasks.forEach((task, name) => {
      task.start();
      logger.info(`✅ Started analytics job: ${name}`);
    });

    this.isRunning = true;
    logger.info('🚀 All analytics jobs started successfully');
  }

  /**
   * Stop all analytics jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('📊 Analytics jobs are not running');
      return;
    }

    logger.info('📴 Stopping analytics jobs...');

    this.tasks.forEach((task, name) => {
      task.stop();
      task.destroy();
      logger.info(`⏹️ Stopped analytics job: ${name}`);
    });

    this.tasks.clear();
    this.isRunning = false;
    logger.info('✅ All analytics jobs stopped');
  }

  /**
   * Process daily analytics
   */
  async processDailyAnalytics() {
    try {
      logger.info('📈 Processing daily analytics...');

      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      yesterday.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      // Daily user activity
      const activeUsers = await User.countDocuments({
        lastLoginAt: { $gte: yesterday, $lt: today }
      });

      // Daily timer sessions
      const dailySessions = await TimerSession.find({
        createdAt: { $gte: yesterday, $lt: today },
        status: 'completed'
      });

      const totalSessionTime = dailySessions.reduce((total, session) => 
        total + (session.actualDuration || session.duration || 0), 0
      );

      // Daily goals created/completed
      const goalsCreated = await Goal.countDocuments({
        createdAt: { $gte: yesterday, $lt: today }
      });

      const goalsCompleted = await Goal.countDocuments({
        completedAt: { $gte: yesterday, $lt: today },
        status: 'completed'
      });

      // Calculate productivity trends
      const avgSessionLength = dailySessions.length > 0 ? 
        Math.floor(totalSessionTime / dailySessions.length / 60) : 0;

      const dailyStats = {
        date: yesterday.toISOString().split('T')[0],
        activeUsers,
        totalSessions: dailySessions.length,
        totalFocusTime: Math.floor(totalSessionTime / 60),
        averageSessionLength: avgSessionLength,
        goalsCreated,
        goalsCompleted,
        completionRate: goalsCreated > 0 ? (goalsCompleted / goalsCreated * 100) : 0
      };

      // Store analytics data
      await analyticsService.storeDailyMetrics(dailyStats);

      // Identify trends and anomalies
      await this.detectTrends('daily', dailyStats);

      logger.info(`📈 Processed daily analytics - ${activeUsers} active users, ${dailySessions.length} sessions`);

    } catch (error) {
      logger.error('❌ Failed to process daily analytics:', error);
    }
  }

  /**
   * Process weekly aggregation
   */
  async processWeeklyAggregation() {
    try {
      logger.info('📊 Processing weekly aggregation...');

      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Weekly user engagement
      const weeklyActiveUsers = await User.countDocuments({
        lastLoginAt: { $gte: oneWeekAgo }
      });

      const newUsers = await User.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });

      // Weekly sessions analysis
      const weeklySessions = await TimerSession.find({
        createdAt: { $gte: oneWeekAgo },
        status: 'completed'
      });

      // User retention analysis
      const retentionData = await this.calculateRetentionMetrics(oneWeekAgo);

      // Goal analysis
      const weeklyGoals = await Goal.find({
        createdAt: { $gte: oneWeekAgo }
      });

      const completedGoals = weeklyGoals.filter(goal => goal.status === 'completed');

      // Popular timer types
      const timerTypeStats = await this.getTimerTypeStatistics(oneWeekAgo);

      // Peak usage hours
      const usagePatterns = await this.analyzeUsagePatterns(oneWeekAgo);

      const weeklyAggregation = {
        weekStart: oneWeekAgo.toISOString().split('T')[0],
        weekEnd: today.toISOString().split('T')[0],
        activeUsers: weeklyActiveUsers,
        newUsers,
        totalSessions: weeklySessions.length,
        totalFocusTime: weeklySessions.reduce((total, session) => 
          total + (session.actualDuration || session.duration || 0), 0) / 60,
        goalsCreated: weeklyGoals.length,
        goalsCompleted: completedGoals.length,
        retentionData,
        timerTypeStats,
        usagePatterns
      };

      await analyticsService.storeWeeklyMetrics(weeklyAggregation);

      logger.info(`📊 Processed weekly aggregation - ${weeklyActiveUsers} active users, ${weeklySessions.length} sessions`);

    } catch (error) {
      logger.error('❌ Failed to process weekly aggregation:', error);
    }
  }

  /**
   * Process monthly insights
   */
  async processMonthlyInsights() {
    try {
      logger.info('📅 Processing monthly insights...');

      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Monthly growth metrics
      const monthlyUsers = await User.countDocuments({
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      });

      const monthlyActiveUsers = await User.countDocuments({
        lastLoginAt: { $gte: lastMonth }
      });

      // Session analytics
      const monthlySessions = await TimerSession.find({
        createdAt: { $gte: lastMonth, $lt: thisMonth },
        status: 'completed'
      });

      // Goal completion trends
      const monthlyGoals = await Goal.find({
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      });

      // User segmentation
      const userSegments = await this.segmentUsers(lastMonth);

      // Feature usage analysis
      const featureUsage = await this.analyzeFeatureUsage(lastMonth);

      // Churn analysis
      const churnAnalysis = await this.analyzeChurn(lastMonth);

      const monthlyInsights = {
        month: `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}`,
        newUsers: monthlyUsers,
        activeUsers: monthlyActiveUsers,
        totalSessions: monthlySessions.length,
        averageSessionsPerUser: monthlyActiveUsers > 0 ? monthlySessions.length / monthlyActiveUsers : 0,
        goalsCreated: monthlyGoals.length,
        goalsCompleted: monthlyGoals.filter(g => g.status === 'completed').length,
        userSegments,
        featureUsage,
        churnAnalysis
      };

      await analyticsService.storeMonthlyInsights(monthlyInsights);

      logger.info(`📅 Processed monthly insights - ${monthlyUsers} new users, ${monthlyActiveUsers} active users`);

    } catch (error) {
      logger.error('❌ Failed to process monthly insights:', error);
    }
  }

  /**
   * Analyze user behavior patterns
   */
  async analyzeUserBehavior() {
    try {
      logger.info('🧠 Analyzing user behavior...');

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

      // Recent user actions
      const recentSessions = await TimerSession.find({
        createdAt: { $gte: sixHoursAgo }
      }).populate('userId');

      // Behavioral patterns
      const behaviorPatterns = {
        averageSessionLength: 0,
        preferredTimerTypes: {},
        breakPatterns: {},
        goalCompletionTiming: {}
      };

      for (const session of recentSessions) {
        // Session length analysis
        const duration = session.actualDuration || session.duration || 0;
        behaviorPatterns.averageSessionLength += duration;

        // Timer type preferences
        const type = session.timerType || 'pomodoro';
        behaviorPatterns.preferredTimerTypes[type] = 
          (behaviorPatterns.preferredTimerTypes[type] || 0) + 1;

        // Break timing analysis
        if (session.breakTaken) {
          const breakTime = new Date(session.createdAt).getHours();
          behaviorPatterns.breakPatterns[breakTime] = 
            (behaviorPatterns.breakPatterns[breakTime] || 0) + 1;
        }
      }

      if (recentSessions.length > 0) {
        behaviorPatterns.averageSessionLength /= recentSessions.length;
      }

      // Store behavioral insights
      await analyticsService.storeBehaviorInsights(behaviorPatterns);

      // Detect unusual patterns that might indicate issues
      await this.detectAnomalies(behaviorPatterns);

      logger.info(`🧠 Analyzed behavior for ${recentSessions.length} recent sessions`);

    } catch (error) {
      logger.error('❌ Failed to analyze user behavior:', error);
    }
  }

  /**
   * Calculate performance metrics
   */
  async calculatePerformanceMetrics() {
    try {
      logger.info('⚡ Calculating performance metrics...');

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // API response time simulation (in real app, this would come from monitoring)
      const performanceMetrics = {
        timestamp: new Date(),
        averageResponseTime: Math.random() * 200 + 100, // 100-300ms
        errorRate: Math.random() * 0.05, // 0-5%
        throughput: Math.floor(Math.random() * 1000 + 500), // 500-1500 requests/hour
        activeConnections: Math.floor(Math.random() * 100 + 50), // 50-150 connections
        memoryUsage: Math.random() * 80 + 20, // 20-100%
        cpuUsage: Math.random() * 60 + 20 // 20-80%
      };

      await analyticsService.storePerformanceMetrics(performanceMetrics);

      // Alert if metrics are concerning
      if (performanceMetrics.errorRate > 0.03) {
        logger.warn(`⚠️ High error rate detected: ${performanceMetrics.errorRate * 100}%`);
      }

      if (performanceMetrics.averageResponseTime > 250) {
        logger.warn(`⚠️ Slow response time detected: ${performanceMetrics.averageResponseTime}ms`);
      }

    } catch (error) {
      logger.error('❌ Failed to calculate performance metrics:', error);
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData() {
    try {
      logger.info('🧹 Cleaning up old data...');

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Delete old completed timer sessions (keep for 6 months)
      const deletedSessions = await TimerSession.deleteMany({
        createdAt: { $lt: sixMonthsAgo },
        status: 'completed'
      });

      // Archive old goal data
      const oldGoals = await Goal.updateMany(
        {
          createdAt: { $lt: sixMonthsAgo },
          status: { $in: ['completed', 'cancelled'] }
        },
        { $set: { archived: true } }
      );

      // Clean up temporary analytics data older than 1 year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      await analyticsService.cleanupOldMetrics(oneYearAgo);

      logger.info(`🧹 Cleanup complete - removed ${deletedSessions.deletedCount} old sessions, archived ${oldGoals.modifiedCount} goals`);

    } catch (error) {
      logger.error('❌ Failed to cleanup old data:', error);
    }
  }

  /**
   * Calculate user retention metrics
   */
  async calculateRetentionMetrics(startDate) {
    const users = await User.find({ createdAt: { $lt: startDate } });
    let dayOneRetention = 0;
    let daySevenRetention = 0;
    let dayThirtyRetention = 0;

    for (const user of users) {
      const dayOne = new Date(user.createdAt.getTime() + 24 * 60 * 60 * 1000);
      const daySeven = new Date(user.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      const dayThirty = new Date(user.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (user.lastLoginAt && user.lastLoginAt >= dayOne) dayOneRetention++;
      if (user.lastLoginAt && user.lastLoginAt >= daySeven) daySevenRetention++;
      if (user.lastLoginAt && user.lastLoginAt >= dayThirty) dayThirtyRetention++;
    }

    return {
      totalUsers: users.length,
      dayOneRetention: users.length > 0 ? (dayOneRetention / users.length * 100) : 0,
      daySevenRetention: users.length > 0 ? (daySevenRetention / users.length * 100) : 0,
      dayThirtyRetention: users.length > 0 ? (dayThirtyRetention / users.length * 100) : 0
    };
  }

  /**
   * Get timer type statistics
   */
  async getTimerTypeStatistics(startDate) {
    const sessions = await TimerSession.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    });

    const stats = {};
    sessions.forEach(session => {
      const type = session.timerType || 'pomodoro';
      stats[type] = (stats[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Analyze usage patterns
   */
  async analyzeUsagePatterns(startDate) {
    const sessions = await TimerSession.find({
      createdAt: { $gte: startDate }
    });

    const hourlyUsage = Array(24).fill(0);
    const dailyUsage = Array(7).fill(0);

    sessions.forEach(session => {
      const hour = new Date(session.createdAt).getHours();
      const day = new Date(session.createdAt).getDay();
      
      hourlyUsage[hour]++;
      dailyUsage[day]++;
    });

    return {
      peakHours: hourlyUsage.indexOf(Math.max(...hourlyUsage)),
      peakDays: dailyUsage.indexOf(Math.max(...dailyUsage)),
      hourlyDistribution: hourlyUsage,
      dailyDistribution: dailyUsage
    };
  }

  /**
   * Segment users based on behavior
   */
  async segmentUsers(startDate) {
    const users = await User.find({});
    const segments = {
      newUsers: 0,
      activeUsers: 0,
      powerUsers: 0,
      atRiskUsers: 0,
      churned: 0
    };

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    for (const user of users) {
      const userSessions = await TimerSession.countDocuments({
        userId: user._id,
        createdAt: { $gte: startDate }
      });

      const daysSinceLastLogin = user.lastLoginAt ? 
        Math.floor((Date.now() - user.lastLoginAt) / (24 * 60 * 60 * 1000)) : 999;

      if (user.createdAt >= startDate) {
        segments.newUsers++;
      } else if (daysSinceLastLogin > 30) {
        segments.churned++;
      } else if (daysSinceLastLogin > 14) {
        segments.atRiskUsers++;
      } else if (userSessions > 20) {
        segments.powerUsers++;
      } else if (user.lastLoginAt >= twoWeeksAgo) {
        segments.activeUsers++;
      }
    }

    return segments;
  }

  /**
   * Analyze feature usage
   */
  async analyzeFeatureUsage(startDate) {
    const timerSessions = await TimerSession.countDocuments({
      createdAt: { $gte: startDate }
    });

    const goalsCreated = await Goal.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Simulate other feature usage (in real app, track these)
    return {
      timerUsage: timerSessions,
      goalTracking: goalsCreated,
      dashboardViews: Math.floor(timerSessions * 2.5), // Estimate
      settingsChanges: Math.floor(goalsCreated * 0.3), // Estimate
      exportUsage: Math.floor(goalsCreated * 0.1) // Estimate
    };
  }

  /**
   * Analyze user churn
   */
  async analyzeChurn(startDate) {
    const totalUsers = await User.countDocuments({
      createdAt: { $lt: startDate }
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const churnedUsers = await User.countDocuments({
      createdAt: { $lt: startDate },
      lastLoginAt: { $lt: thirtyDaysAgo }
    });

    return {
      totalUsers,
      churnedUsers,
      churnRate: totalUsers > 0 ? (churnedUsers / totalUsers * 100) : 0,
      retentionRate: totalUsers > 0 ? ((totalUsers - churnedUsers) / totalUsers * 100) : 0
    };
  }

  /**
   * Detect trends in data
   */
  async detectTrends(period, data) {
    // Simple trend detection - in production, use more sophisticated algorithms
    const previousData = await analyticsService.getPreviousMetrics(period, data.date);
    
    if (previousData) {
      const trends = {};
      
      // Check for significant changes (>20%)
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'number' && typeof previousData[key] === 'number') {
          const change = ((data[key] - previousData[key]) / previousData[key]) * 100;
          if (Math.abs(change) > 20) {
            trends[key] = {
              change: change.toFixed(1),
              direction: change > 0 ? 'up' : 'down',
              significant: Math.abs(change) > 50
            };
          }
        }
      });

      if (Object.keys(trends).length > 0) {
        logger.info(`📊 Trends detected for ${period}:`, trends);
        await analyticsService.storeTrendData(period, trends);
      }
    }
  }

  /**
   * Detect anomalies in behavior patterns
   */
  async detectAnomalies(patterns) {
    // Simple anomaly detection
    const anomalies = [];

    // Check for unusual session lengths
    if (patterns.averageSessionLength < 5 * 60 || patterns.averageSessionLength > 120 * 60) {
      anomalies.push({
        type: 'session_length',
        value: patterns.averageSessionLength / 60,
        message: `Unusual average session length: ${(patterns.averageSessionLength / 60).toFixed(1)} minutes`
      });
    }

    // Check for unusual break patterns
    const totalBreaks = Object.values(patterns.breakPatterns).reduce((a, b) => a + b, 0);
    if (totalBreaks > 0) {
      const breakHours = Object.keys(patterns.breakPatterns).map(Number);
      const avgBreakHour = breakHours.reduce((sum, hour, _, arr) => sum + hour / arr.length, 0);
      
      if (avgBreakHour < 6 || avgBreakHour > 22) {
        anomalies.push({
          type: 'break_timing',
          value: avgBreakHour,
          message: `Unusual break timing: ${avgBreakHour.toFixed(1)}:00`
        });
      }
    }

    if (anomalies.length > 0) {
      logger.warn('🚨 Anomalies detected:', anomalies);
      await analyticsService.storeAnomalies(anomalies);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.tasks.keys()),
      jobCount: this.tasks.size
    };
  }

  /**
   * Run specific job manually (for testing)
   */
  async runJob(jobName) {
    switch (jobName) {
      case 'dailyAnalytics':
        await this.processDailyAnalytics();
        break;
      case 'weeklyAggregation':
        await this.processWeeklyAggregation();
        break;
      case 'monthlyInsights':
        await this.processMonthlyInsights();
        break;
      case 'userBehavior':
        await this.analyzeUserBehavior();
        break;
      case 'performanceMetrics':
        await this.calculatePerformanceMetrics();
        break;
      case 'dataCleanup':
        await this.cleanupOldData();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

module.exports = new AnalyticsJob();
