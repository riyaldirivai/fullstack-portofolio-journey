/**
 * Reminder Job
 * Handles scheduled reminders for goals, timer sessions, and productivity nudges
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const Goal = require('../models/Goal');
const User = require('../models/User');
const TimerSession = require('../models/TimerSession');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

class ReminderJob {
  constructor() {
    this.isRunning = false;
    this.tasks = new Map();
  }

  /**
   * Start all reminder jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('⏰ Reminder jobs are already running');
      return;
    }

    logger.info('⏰ Starting reminder jobs...');

    // Goal deadline reminders - every day at 9 AM
    this.tasks.set('goalDeadlines', cron.schedule('0 9 * * *', async () => {
      await this.checkGoalDeadlines();
    }, { scheduled: false }));

    // Daily productivity check - every day at 6 PM
    this.tasks.set('dailyCheck', cron.schedule('0 18 * * *', async () => {
      await this.sendDailyProductivityCheck();
    }, { scheduled: false }));

    // Weekly goal review - every Sunday at 7 PM
    this.tasks.set('weeklyReview', cron.schedule('0 19 * * 0', async () => {
      await this.sendWeeklyGoalReview();
    }, { scheduled: false }));

    // Inactive user nudge - every day at 10 AM
    this.tasks.set('inactiveUsers', cron.schedule('0 10 * * *', async () => {
      await this.nudgeInactiveUsers();
    }, { scheduled: false }));

    // Break reminders - every 25 minutes during work hours (9 AM - 6 PM)
    this.tasks.set('breakReminders', cron.schedule('*/25 9-17 * * 1-5', async () => {
      await this.sendBreakReminders();
    }, { scheduled: false }));

    // Monthly progress report - first day of month at 9 AM
    this.tasks.set('monthlyReport', cron.schedule('0 9 1 * *', async () => {
      await this.sendMonthlyProgressReport();
    }, { scheduled: false }));

    // Start all scheduled tasks
    this.tasks.forEach((task, name) => {
      task.start();
      logger.info(`✅ Started reminder job: ${name}`);
    });

    this.isRunning = true;
    logger.info('🚀 All reminder jobs started successfully');
  }

  /**
   * Stop all reminder jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('⏰ Reminder jobs are not running');
      return;
    }

    logger.info('📴 Stopping reminder jobs...');

    this.tasks.forEach((task, name) => {
      task.stop();
      task.destroy();
      logger.info(`⏹️ Stopped reminder job: ${name}`);
    });

    this.tasks.clear();
    this.isRunning = false;
    logger.info('✅ All reminder jobs stopped');
  }

  /**
   * Check for upcoming goal deadlines
   */
  async checkGoalDeadlines() {
    try {
      logger.info('📅 Checking goal deadlines...');

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find goals due tomorrow
      const goalsDueTomorrow = await Goal.find({
        status: 'active',
        dueDate: {
          $gte: tomorrow,
          $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('userId');

      // Find goals due next week
      const goalsDueNextWeek = await Goal.find({
        status: 'active',
        dueDate: {
          $gte: nextWeek,
          $lt: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }).populate('userId');

      // Send reminders for tomorrow's deadlines
      for (const goal of goalsDueTomorrow) {
        if (goal.userId) {
          await notificationService.sendGoalDeadlineReminder(goal.userId._id, goal);
          
          // Also send email if user preferences allow
          const user = goal.userId;
          if (user.notificationPreferences?.goalReminders !== false) {
            await emailService.sendGoalReminder(user, goal);
          }
        }
      }

      // Send weekly planning reminders
      for (const goal of goalsDueNextWeek) {
        if (goal.userId) {
          await notificationService.sendRealTimeNotification(goal.userId._id, {
            type: 'goal-planning',
            title: 'Goal Planning Reminder 📋',
            message: `"${goal.title}" is due next week. Plan your tasks!`,
            icon: '📋'
          });
        }
      }

      logger.info(`📅 Processed ${goalsDueTomorrow.length + goalsDueNextWeek.length} goal deadline reminders`);

    } catch (error) {
      logger.error('❌ Failed to check goal deadlines:', error);
    }
  }

  /**
   * Send daily productivity check
   */
  async sendDailyProductivityCheck() {
    try {
      logger.info('📊 Sending daily productivity checks...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find users who haven't had any timer sessions today
      const usersWithoutSessions = await User.find({
        lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
      });

      for (const user of usersWithoutSessions) {
        const todaySessions = await TimerSession.countDocuments({
          userId: user._id,
          createdAt: { $gte: today }
        });

        if (todaySessions === 0) {
          await notificationService.sendRealTimeNotification(user._id, {
            type: 'productivity-nudge',
            title: 'Daily Productivity Check 🎯',
            message: 'You haven\'t started any focus sessions today. Ready to be productive?',
            icon: '🎯'
          });

          // Send gentle email reminder if it's been 2+ days
          const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
          const recentSessions = await TimerSession.countDocuments({
            userId: user._id,
            createdAt: { $gte: twoDaysAgo }
          });

          if (recentSessions === 0 && user.notificationPreferences?.general !== false) {
            await emailService.sendEmail(
              user.email,
              'Missing you in productivity! 💙',
              `Hi ${user.name},\n\nWe noticed you haven't been active lately. Remember, even small steps count towards your goals!\n\nReady to get back on track?`,
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">Missing you! 💙</h2>
                <p>Hi ${user.name},</p>
                <p>We noticed you haven't been active lately. Remember, even small steps count towards your goals!</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL}/dashboard" 
                     style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Get Back on Track
                  </a>
                </div>
                <p>You've got this! 💪</p>
              </div>
              `
            );
          }
        }
      }

      logger.info(`📊 Sent daily productivity checks to ${usersWithoutSessions.length} users`);

    } catch (error) {
      logger.error('❌ Failed to send daily productivity checks:', error);
    }
  }

  /**
   * Send weekly goal review
   */
  async sendWeeklyGoalReview() {
    try {
      logger.info('📈 Sending weekly goal reviews...');

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const users = await User.find({
        lastLoginAt: { $gte: oneWeekAgo }
      });

      for (const user of users) {
        // Get user's goals and progress
        const goals = await Goal.find({ userId: user._id, status: { $in: ['active', 'completed'] } });
        const completedThisWeek = goals.filter(goal => 
          goal.completedAt && new Date(goal.completedAt) >= oneWeekAgo
        );

        // Get timer sessions for the week
        const weekSessions = await TimerSession.find({
          userId: user._id,
          createdAt: { $gte: oneWeekAgo },
          status: 'completed'
        });

        const totalFocusTime = weekSessions.reduce((total, session) => 
          total + (session.actualDuration || session.duration || 0), 0
        );

        // Send weekly review notification
        await notificationService.sendRealTimeNotification(user._id, {
          type: 'weekly-review',
          title: 'Weekly Review 📈',
          message: `This week: ${completedThisWeek.length} goals completed, ${Math.floor(totalFocusTime / 60)} minutes focused.`,
          icon: '📈'
        });

        // Send detailed email report if enabled
        if (user.notificationPreferences?.weeklyReport !== false) {
          await emailService.sendWeeklyReport(user, {
            totalFocusTime: Math.floor(totalFocusTime / 60),
            completedGoals: completedThisWeek.length,
            timerSessions: weekSessions.length,
            currentStreak: await this.calculateUserStreak(user._id)
          });
        }
      }

      logger.info(`📈 Sent weekly reviews to ${users.length} users`);

    } catch (error) {
      logger.error('❌ Failed to send weekly goal reviews:', error);
    }
  }

  /**
   * Nudge inactive users
   */
  async nudgeInactiveUsers() {
    try {
      logger.info('👋 Nudging inactive users...');

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Find users inactive for 3+ days but less than a week
      const inactiveUsers = await User.find({
        lastLoginAt: {
          $gte: oneWeekAgo,
          $lt: threeDaysAgo
        }
      });

      for (const user of inactiveUsers) {
        const daysSinceLogin = Math.floor((Date.now() - new Date(user.lastLoginAt)) / (24 * 60 * 60 * 1000));
        
        // Send gentle nudge
        await notificationService.sendSystemNotification(
          user._id,
          `We miss you! 🌟`,
          `It's been ${daysSinceLogin} days since your last session. Your goals are waiting for you!`,
          {
            icon: '🌟',
            channels: ['email']
          }
        );
      }

      logger.info(`👋 Nudged ${inactiveUsers.length} inactive users`);

    } catch (error) {
      logger.error('❌ Failed to nudge inactive users:', error);
    }
  }

  /**
   * Send break reminders to users with active timer sessions
   */
  async sendBreakReminders() {
    try {
      logger.info('☕ Sending break reminders...');

      // Find users with long-running sessions (> 50 minutes)
      const fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);
      
      const longSessions = await TimerSession.find({
        status: 'running',
        startedAt: { $lt: fiftyMinutesAgo }
      }).populate('userId');

      for (const session of longSessions) {
        if (session.userId) {
          await notificationService.sendBreakReminder(session.userId._id, session);
        }
      }

      logger.info(`☕ Sent break reminders to ${longSessions.length} users`);

    } catch (error) {
      logger.error('❌ Failed to send break reminders:', error);
    }
  }

  /**
   * Send monthly progress report
   */
  async sendMonthlyProgressReport() {
    try {
      logger.info('📅 Sending monthly progress reports...');

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const users = await User.find({
        createdAt: { $lt: oneMonthAgo } // Only users who have been around for at least a month
      });

      for (const user of users) {
        // Calculate monthly stats
        const monthlyGoals = await Goal.countDocuments({
          userId: user._id,
          createdAt: { $gte: oneMonthAgo }
        });

        const completedGoals = await Goal.countDocuments({
          userId: user._id,
          completedAt: { $gte: oneMonthAgo },
          status: 'completed'
        });

        const monthlySessions = await TimerSession.find({
          userId: user._id,
          createdAt: { $gte: oneMonthAgo },
          status: 'completed'
        });

        const totalFocusTime = monthlySessions.reduce((total, session) => 
          total + (session.actualDuration || session.duration || 0), 0
        );

        // Send comprehensive monthly report
        if (user.notificationPreferences?.monthlyReport !== false) {
          await emailService.sendEmail(
            user.email,
            'Your Monthly Progress Report 📊',
            'Your detailed monthly productivity report is attached.',
            this.generateMonthlyReportHTML(user, {
              totalGoals: monthlyGoals,
              completedGoals,
              totalSessions: monthlySessions.length,
              totalFocusTime: Math.floor(totalFocusTime / 60),
              averageSessionLength: monthlySessions.length > 0 ? Math.floor(totalFocusTime / monthlySessions.length / 60) : 0
            })
          );
        }
      }

      logger.info(`📅 Sent monthly reports to ${users.length} users`);

    } catch (error) {
      logger.error('❌ Failed to send monthly progress reports:', error);
    }
  }

  /**
   * Calculate user's current streak
   */
  async calculateUserStreak(userId) {
    try {
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
    } catch (error) {
      console.error('Failed to calculate user streak:', error);
      return 0;
    }
  }

  /**
   * Generate monthly report HTML
   */
  generateMonthlyReportHTML(user, stats) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Monthly Progress Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #667eea; font-size: 2.5rem; margin-bottom: 10px;">📊</h1>
            <h1 style="color: #667eea;">Monthly Progress Report</h1>
            <p style="color: #718096; font-size: 1.1rem;">Hi ${user.name}, here's your productivity summary for this month!</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0;">
            <div style="background: linear-gradient(135deg, #e6fffa, #b2f5ea); padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; color: #00a86b; font-size: 2rem;">${stats.totalGoals}</h2>
                <p style="margin: 5px 0 0 0; color: #2d3748; font-weight: 600;">Goals Created</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #f0f4ff, #ddd6fe); padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; color: #667eea; font-size: 2rem;">${stats.completedGoals}</h2>
                <p style="margin: 5px 0 0 0; color: #2d3748; font-weight: 600;">Goals Completed</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fff5f5, #fed7d7); padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; color: #e53e3e; font-size: 2rem;">${stats.totalSessions}</h2>
                <p style="margin: 5px 0 0 0; color: #2d3748; font-weight: 600;">Focus Sessions</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #fffaf0, #feebc8); padding: 20px; border-radius: 12px; text-align: center;">
                <h2 style="margin: 0; color: #ff8c00; font-size: 2rem;">${stats.totalFocusTime}h</h2>
                <p style="margin: 5px 0 0 0; color: #2d3748; font-weight: 600;">Total Focus Time</p>
            </div>
        </div>

        <div style="background: #f8faff; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <h3 style="color: #667eea; margin: 0 0 15px 0;">🎯 Key Insights</h3>
            <p style="margin: 0 0 10px 0;">
                <strong>Completion Rate:</strong> ${stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0}%
            </p>
            <p style="margin: 0 0 10px 0;">
                <strong>Average Session:</strong> ${stats.averageSessionLength} minutes
            </p>
            <p style="margin: 0;">
                <strong>Daily Average:</strong> ${Math.floor(stats.totalFocusTime / 30)} minutes per day
            </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL}/analytics" 
               style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
                View Detailed Analytics
            </a>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 0.9rem;">
                Keep up the great work! Every step forward counts. 💪
            </p>
            <p style="color: #718096; font-size: 0.8rem;">
                Best regards,<br>The Productivity Dashboard Team
            </p>
        </div>
    </body>
    </html>
    `;
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
      case 'goalDeadlines':
        await this.checkGoalDeadlines();
        break;
      case 'dailyCheck':
        await this.sendDailyProductivityCheck();
        break;
      case 'weeklyReview':
        await this.sendWeeklyGoalReview();
        break;
      case 'inactiveUsers':
        await this.nudgeInactiveUsers();
        break;
      case 'breakReminders':
        await this.sendBreakReminders();
        break;
      case 'monthlyReport':
        await this.sendMonthlyProgressReport();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

module.exports = new ReminderJob();
