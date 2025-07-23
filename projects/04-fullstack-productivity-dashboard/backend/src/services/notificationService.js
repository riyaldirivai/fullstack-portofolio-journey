/**
 * Notification Service
 * Handles push notifications, email alerts, and in-app notifications
 */

const logger = require('../utils/logger');
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.subscribers = new Map(); // WebSocket connections for real-time notifications
    this.notificationQueue = [];
    this.pushSubscriptions = new Map(); // Push notification subscriptions
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      logger.info('🔔 Initializing Notification Service...');
      
      // Process notification queue periodically
      this.setupQueueProcessor();
      
      this.isInitialized = true;
      logger.info('✅ Notification Service initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Notification Service:', error);
      throw error;
    }
  }

  /**
   * Setup periodic notification queue processing
   */
  setupQueueProcessor() {
    setInterval(async () => {
      if (this.notificationQueue.length > 0) {
        const notifications = this.notificationQueue.splice(0, 10); // Process 10 at a time
        for (const notification of notifications) {
          await this.processNotification(notification);
        }
      }
    }, 5000); // Process every 5 seconds
  }

  /**
   * Add WebSocket subscriber for real-time notifications
   */
  addSubscriber(userId, websocket) {
    this.subscribers.set(userId, websocket);
    logger.info(`🔔 Added notification subscriber for user: ${userId}`);

    // Handle websocket close
    websocket.on('close', () => {
      this.subscribers.delete(userId);
      logger.info(`🔔 Removed notification subscriber for user: ${userId}`);
    });
  }

  /**
   * Remove WebSocket subscriber
   */
  removeSubscriber(userId) {
    this.subscribers.delete(userId);
  }

  /**
   * Send real-time notification to user
   */
  sendRealTimeNotification(userId, notification) {
    const subscriber = this.subscribers.get(userId);
    if (subscriber && subscriber.readyState === 1) { // WebSocket.OPEN
      try {
        subscriber.send(JSON.stringify({
          type: 'notification',
          data: notification
        }));
        return true;
      } catch (error) {
        logger.error(`Failed to send real-time notification to user ${userId}:`, error);
        this.subscribers.delete(userId);
        return false;
      }
    }
    return false;
  }

  /**
   * Queue notification for processing
   */
  queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      queuedAt: new Date().toISOString()
    });
  }

  /**
   * Process a single notification
   */
  async processNotification(notification) {
    try {
      const { userId, type, data, channels = ['realtime'] } = notification;

      // Send real-time notification
      if (channels.includes('realtime')) {
        this.sendRealTimeNotification(userId, {
          id: this.generateNotificationId(),
          type,
          title: data.title,
          message: data.message,
          icon: data.icon,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      // Send push notification
      if (channels.includes('push')) {
        await this.sendPushNotification(userId, data);
      }

      // Send email notification
      if (channels.includes('email')) {
        await this.sendEmailNotification(userId, type, data);
      }

    } catch (error) {
      logger.error('Failed to process notification:', error);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, data) {
    const subscription = this.pushSubscriptions.get(userId);
    if (!subscription) {
      return;
    }

    try {
      const webpush = require('web-push');
      
      // Configure web push (would be set in environment variables)
      webpush.setVapidDetails(
        'mailto:' + process.env.VAPID_EMAIL,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      const payload = JSON.stringify({
        title: data.title,
        body: data.message,
        icon: data.icon || '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        data: {
          url: data.url || '/dashboard',
          timestamp: Date.now()
        }
      });

      await webpush.sendNotification(subscription, payload);
      logger.info(`🔔 Push notification sent to user: ${userId}`);
      
    } catch (error) {
      logger.error(`Failed to send push notification to user ${userId}:`, error);
      
      // Remove invalid subscription
      if (error.statusCode === 410) {
        this.pushSubscriptions.delete(userId);
      }
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, type, data) {
    try {
      // Get user email (this would typically come from user service/database)
      const user = await this.getUserById(userId);
      if (!user || !user.email) {
        return;
      }

      // Check user email preferences
      if (!this.shouldSendEmail(user, type)) {
        return;
      }

      // Send appropriate email based on type
      switch (type) {
        case 'goal-reminder':
          await emailService.sendGoalReminder(user, data.goal);
          break;
        
        case 'timer-complete':
          await emailService.sendTimerSummary(user, data.summary);
          break;
        
        case 'achievement':
          await emailService.sendAchievementEmail(user, data.achievement);
          break;
        
        case 'weekly-report':
          await emailService.sendWeeklyReport(user, data.report);
          break;
        
        default:
          await emailService.sendEmail(
            user.email,
            data.title,
            data.message,
            data.html
          );
      }

    } catch (error) {
      logger.error(`Failed to send email notification for user ${userId}:`, error);
    }
  }

  /**
   * Check if email should be sent based on user preferences
   */
  shouldSendEmail(user, notificationType) {
    // Default preferences if not set
    const defaultPreferences = {
      goalReminders: true,
      timerComplete: false,
      achievements: true,
      weeklyReport: true,
      general: true
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    switch (notificationType) {
      case 'goal-reminder':
        return preferences.goalReminders;
      case 'timer-complete':
        return preferences.timerComplete;
      case 'achievement':
        return preferences.achievements;
      case 'weekly-report':
        return preferences.weeklyReport;
      default:
        return preferences.general;
    }
  }

  /**
   * Subscribe user to push notifications
   */
  subscribeToPush(userId, subscription) {
    this.pushSubscriptions.set(userId, subscription);
    logger.info(`🔔 User ${userId} subscribed to push notifications`);
  }

  /**
   * Unsubscribe user from push notifications
   */
  unsubscribeFromPush(userId) {
    this.pushSubscriptions.delete(userId);
    logger.info(`🔔 User ${userId} unsubscribed from push notifications`);
  }

  /**
   * Send goal deadline reminder
   */
  sendGoalDeadlineReminder(userId, goal) {
    this.queueNotification({
      userId,
      type: 'goal-reminder',
      channels: ['realtime', 'email'],
      data: {
        title: 'Goal Deadline Approaching',
        message: `Your goal "${goal.title}" is due soon!`,
        icon: '📋',
        goal,
        url: `/goals/${goal.id}`
      }
    });
  }

  /**
   * Send timer completion notification
   */
  sendTimerCompleteNotification(userId, timerSession) {
    const duration = Math.round(timerSession.duration / 60);
    
    this.queueNotification({
      userId,
      type: 'timer-complete',
      channels: ['realtime', 'push'],
      data: {
        title: 'Timer Session Complete! 🎉',
        message: `Great job! You completed a ${duration}-minute session.`,
        icon: '⏰',
        session: timerSession,
        url: '/timer'
      }
    });
  }

  /**
   * Send achievement notification
   */
  sendAchievementNotification(userId, achievement) {
    this.queueNotification({
      userId,
      type: 'achievement',
      channels: ['realtime', 'push', 'email'],
      data: {
        title: 'Achievement Unlocked! 🏆',
        message: `You earned: ${achievement.title}`,
        icon: achievement.icon || '🏆',
        achievement,
        url: '/achievements'
      }
    });
  }

  /**
   * Send break reminder
   */
  sendBreakReminder(userId, sessionData) {
    this.queueNotification({
      userId,
      type: 'break-reminder',
      channels: ['realtime', 'push'],
      data: {
        title: 'Time for a Break! ☕',
        message: 'You\'ve been working hard. Take a well-deserved break.',
        icon: '☕',
        url: '/timer'
      }
    });
  }

  /**
   * Send daily summary notification
   */
  sendDailySummary(userId, summaryData) {
    const focusTime = Math.round(summaryData.totalFocusTime / 60);
    
    this.queueNotification({
      userId,
      type: 'daily-summary',
      channels: ['realtime'],
      data: {
        title: 'Daily Summary 📊',
        message: `Today: ${summaryData.sessions} sessions, ${focusTime} minutes focus time`,
        icon: '📊',
        summary: summaryData,
        url: '/analytics'
      }
    });
  }

  /**
   * Send weekly report notification
   */
  sendWeeklyReport(userId, reportData) {
    this.queueNotification({
      userId,
      type: 'weekly-report',
      channels: ['email'],
      data: {
        title: 'Your Weekly Productivity Report',
        message: 'Your productivity summary is ready!',
        report: reportData
      }
    });
  }

  /**
   * Send goal progress update
   */
  sendGoalProgressUpdate(userId, goal, milestone) {
    this.queueNotification({
      userId,
      type: 'goal-progress',
      channels: ['realtime'],
      data: {
        title: 'Goal Progress Update 🎯',
        message: `${milestone}% progress on "${goal.title}"`,
        icon: '🎯',
        goal,
        milestone,
        url: `/goals/${goal.id}`
      }
    });
  }

  /**
   * Send streak achievement notification
   */
  sendStreakNotification(userId, streakDays) {
    const emoji = streakDays >= 30 ? '🔥' : streakDays >= 7 ? '⚡' : '🌟';
    
    this.queueNotification({
      userId,
      type: 'streak-achievement',
      channels: ['realtime', 'push'],
      data: {
        title: `${streakDays} Day Streak! ${emoji}`,
        message: `Amazing! You're on a ${streakDays}-day productivity streak!`,
        icon: emoji,
        streakDays,
        url: '/analytics'
      }
    });
  }

  /**
   * Send system notification
   */
  sendSystemNotification(userId, title, message, options = {}) {
    this.queueNotification({
      userId,
      type: 'system',
      channels: options.channels || ['realtime'],
      data: {
        title,
        message,
        icon: options.icon || '🔔',
        url: options.url || '/dashboard'
      }
    });
  }

  /**
   * Generate unique notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user by ID (placeholder - would integrate with user service)
   */
  async getUserById(userId) {
    try {
      // This would typically fetch from database or user service
      const User = require('../models/User');
      return await User.findById(userId);
    } catch (error) {
      logger.error(`Failed to get user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    return {
      queueLength: this.notificationQueue.length,
      activeSubscribers: this.subscribers.size,
      pushSubscriptions: this.pushSubscriptions.size,
      processedToday: 0 // Would track this with proper metrics
    };
  }

  /**
   * Test notification functionality
   */
  async testNotification(userId) {
    this.queueNotification({
      userId,
      type: 'test',
      channels: ['realtime', 'push'],
      data: {
        title: 'Test Notification',
        message: 'This is a test notification from your productivity dashboard!',
        icon: '🧪'
      }
    });

    return { success: true, message: 'Test notification queued' };
  }

  /**
   * Bulk send notifications to multiple users
   */
  bulkSendNotification(userIds, notificationData) {
    userIds.forEach(userId => {
      this.queueNotification({
        userId,
        ...notificationData
      });
    });

    logger.info(`🔔 Queued ${userIds.length} bulk notifications`);
  }

  /**
   * Schedule future notification
   */
  scheduleNotification(userId, notificationData, scheduleTime) {
    const delay = new Date(scheduleTime) - new Date();
    
    if (delay > 0) {
      setTimeout(() => {
        this.queueNotification({
          userId,
          ...notificationData
        });
      }, delay);
      
      logger.info(`🕐 Scheduled notification for user ${userId} at ${scheduleTime}`);
    }
  }

  /**
   * Get user notification history (placeholder)
   */
  async getNotificationHistory(userId, limit = 50) {
    // This would typically fetch from database
    return {
      notifications: [],
      total: 0,
      unread: 0
    };
  }

  /**
   * Mark notification as read (placeholder)
   */
  async markAsRead(userId, notificationId) {
    // This would typically update in database
    logger.info(`📬 Marked notification ${notificationId} as read for user ${userId}`);
    return { success: true };
  }
}

module.exports = new NotificationService();
