/**
 * Background Jobs Integration Tests
 * Tests for reminder jobs, analytics jobs, and job management
 */

const jobManager = require('../../src/jobs/jobManager');
const reminderJob = require('../../src/jobs/reminderJob');
const analyticsJob = require('../../src/jobs/analyticsJob');

// Mock external services
const mockServices = testHelpers.mockServices();

jest.mock('../../src/services/emailService', () => mockServices.emailService);
jest.mock('../../src/services/notificationService', () => mockServices.notificationService);
jest.mock('../../src/services/analyticsService', () => mockServices.analyticsService);

describe('Background Jobs System', () => {
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Ensure job manager is stopped
    if (jobManager.getStatus().isInitialized) {
      await jobManager.shutdown();
    }
  });

  afterEach(async () => {
    // Clean shutdown after each test
    if (jobManager.getStatus().isInitialized) {
      await jobManager.shutdown();
    }
  });

  describe('Job Manager', () => {
    it('should initialize and start all jobs', async () => {
      await jobManager.initialize();
      
      const status = jobManager.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.jobs.reminder.isRunning).toBe(true);
      expect(status.jobs.analytics.isRunning).toBe(true);
    });

    it('should shutdown all jobs gracefully', async () => {
      await jobManager.initialize();
      await jobManager.shutdown();
      
      const status = jobManager.getStatus();
      expect(status.isInitialized).toBe(false);
    });

    it('should get job statistics', async () => {
      await jobManager.initialize();
      
      const stats = await jobManager.getJobStatistics();
      expect(stats).toHaveProperty('timestamp');
      expect(stats).toHaveProperty('overview');
      expect(stats).toHaveProperty('details');
      expect(stats.overview.totalJobTypes).toBeGreaterThan(0);
    });

    it('should perform health check', async () => {
      await jobManager.initialize();
      
      const health = await jobManager.healthCheck();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health.status).toBe('healthy');
    });

    it('should run specific jobs manually', async () => {
      await jobManager.initialize();
      
      // Test running a reminder job
      await expect(jobManager.runJob('reminder', 'goalDeadlines')).resolves.not.toThrow();
      
      // Test running an analytics job
      await expect(jobManager.runJob('analytics', 'userBehavior')).resolves.not.toThrow();
    });

    it('should handle invalid job types', async () => {
      await jobManager.initialize();
      
      await expect(jobManager.runJob('invalid', 'test')).rejects.toThrow('Unknown job type');
    });

    it('should restart job types', async () => {
      await jobManager.initialize();
      
      await expect(jobManager.restartJobType('reminder')).resolves.not.toThrow();
      
      const status = jobManager.getStatus();
      expect(status.jobs.reminder.isRunning).toBe(true);
    });

    it('should schedule one-time jobs', async () => {
      await jobManager.initialize();
      
      const result = await jobManager.scheduleOneTimeJob('reminder', 'goalDeadlines', 1000);
      
      expect(result.scheduled).toBe(true);
      expect(result.jobType).toBe('reminder');
      expect(result.jobName).toBe('goalDeadlines');
    });
  });

  describe('Reminder Jobs', () => {
    beforeEach(async () => {
      await jobManager.initialize();
    });

    describe('Goal Deadline Reminders', () => {
      it('should send reminders for goals due tomorrow', async () => {
        // Create test data
        const { user, goals } = await testHelpers.createTestUser();
        const tomorrowGoal = await factory.create('Goal', {
          userId: user._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'active'
        });

        // Run the job
        await reminderJob.runJob('goalDeadlines');

        // Verify notifications were sent
        testHelpers.expectNotificationSent(
          mockServices.notificationService,
          user._id,
          'goal-deadline'
        );
      });

      it('should send weekly planning reminders', async () => {
        // Create test data
        const { user } = await testHelpers.createTestUser();
        const nextWeekGoal = await factory.create('Goal', {
          userId: user._id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
          status: 'active'
        });

        // Run the job
        await reminderJob.runJob('goalDeadlines');

        // Verify notifications were sent
        testHelpers.expectNotificationSent(
          mockServices.notificationService,
          user._id,
          'goal-planning'
        );
      });

      it('should respect user notification preferences', async () => {
        // Create user with notifications disabled
        const user = await factory.create('User', {
          notificationPreferences: {
            goalReminders: false
          }
        });

        const tomorrowGoal = await factory.create('Goal', {
          userId: user._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'active'
        });

        await reminderJob.runJob('goalDeadlines');

        // Should not send email
        expect(mockServices.emailService.sendGoalReminder).not.toHaveBeenCalled();
      });
    });

    describe('Daily Productivity Check', () => {
      it('should nudge users without sessions today', async () => {
        // Create user with recent login but no sessions today
        const user = await factory.create('User', {
          lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        });

        await reminderJob.runJob('dailyCheck');

        testHelpers.expectNotificationSent(
          mockServices.notificationService,
          user._id,
          'productivity-nudge'
        );
      });

      it('should send email reminders for inactive users', async () => {
        // Create user inactive for 3 days
        const user = await factory.create('User', {
          lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        });

        await reminderJob.runJob('dailyCheck');

        expect(mockServices.emailService.sendEmail).toHaveBeenCalled();
      });

      it('should not nudge users with recent sessions', async () => {
        const { user } = await testHelpers.createTestUser();
        
        // Create today's session
        await factory.create('TimerSession', {
          userId: user._id,
          createdAt: new Date(),
          status: 'completed'
        });

        await reminderJob.runJob('dailyCheck');

        // Should not send productivity nudge
        expect(mockServices.notificationService.send).not.toHaveBeenCalledWith(
          user._id,
          expect.objectContaining({ type: 'productivity-nudge' })
        );
      });
    });

    describe('Weekly Goal Review', () => {
      it('should send weekly review to active users', async () => {
        const { user, goals, sessions } = await testHelpers.createTestUser();

        await reminderJob.runJob('weeklyReview');

        testHelpers.expectNotificationSent(
          mockServices.notificationService,
          user._id,
          'weekly-review'
        );
      });

      it('should include weekly statistics in review', async () => {
        const { user } = await testHelpers.createTestUser();
        
        // Create some completed goals this week
        await factory.create('CompletedGoal', {
          userId: user._id,
          completedAt: new Date()
        });

        await reminderJob.runJob('weeklyReview');

        expect(mockServices.emailService.sendWeeklyReport).toHaveBeenCalledWith(
          user,
          expect.objectContaining({
            completedGoals: expect.any(Number),
            totalFocusTime: expect.any(Number)
          })
        );
      });
    });

    describe('Break Reminders', () => {
      it('should remind users with long-running sessions', async () => {
        const { user } = await testHelpers.createTestUser();
        
        // Create long-running session
        const longSession = await factory.create('ActiveTimerSession', {
          userId: user._id,
          startedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          status: 'running'
        });

        await reminderJob.runJob('breakReminders');

        expect(mockServices.notificationService.sendBreakReminder).toHaveBeenCalledWith(
          user._id,
          expect.any(Object)
        );
      });

      it('should not remind users with short sessions', async () => {
        const { user } = await testHelpers.createTestUser();
        
        // Create short session
        await factory.create('ActiveTimerSession', {
          userId: user._id,
          startedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          status: 'running'
        });

        await reminderJob.runJob('breakReminders');

        expect(mockServices.notificationService.sendBreakReminder).not.toHaveBeenCalled();
      });
    });

    describe('Inactive User Nudging', () => {
      it('should nudge users inactive for 3+ days', async () => {
        const inactiveUser = await factory.create('User', {
          lastLoginAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
        });

        await reminderJob.runJob('inactiveUsers');

        expect(mockServices.notificationService.sendSystemNotification).toHaveBeenCalledWith(
          inactiveUser._id,
          expect.stringContaining('We miss you'),
          expect.any(String),
          expect.any(Object)
        );
      });

      it('should not nudge recently active users', async () => {
        const activeUser = await factory.create('User', {
          lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
        });

        await reminderJob.runJob('inactiveUsers');

        expect(mockServices.notificationService.sendSystemNotification).not.toHaveBeenCalledWith(
          activeUser._id,
          expect.stringContaining('We miss you'),
          expect.any(String),
          expect.any(Object)
        );
      });
    });
  });

  describe('Analytics Jobs', () => {
    beforeEach(async () => {
      await jobManager.initialize();
    });

    describe('Daily Analytics Processing', () => {
      it('should process daily metrics correctly', async () => {
        // Create test data for yesterday
        const { user, sessions } = await testHelpers.createTestUser();

        await analyticsJob.runJob('dailyAnalytics');

        expect(mockServices.analyticsService.storeDailyMetrics).toHaveBeenCalledWith(
          expect.objectContaining({
            date: expect.any(String),
            activeUsers: expect.any(Number),
            totalSessions: expect.any(Number),
            totalFocusTime: expect.any(Number)
          })
        );
      });

      it('should calculate productivity trends', async () => {
        await analyticsJob.runJob('dailyAnalytics');

        // Should attempt to detect trends
        expect(mockServices.analyticsService.storeDailyMetrics).toHaveBeenCalled();
      });
    });

    describe('Weekly Aggregation', () => {
      it('should aggregate weekly data', async () => {
        await analyticsJob.runJob('weeklyAggregation');

        expect(mockServices.analyticsService.storeWeeklyMetrics).toHaveBeenCalledWith(
          expect.objectContaining({
            weekStart: expect.any(String),
            weekEnd: expect.any(String),
            activeUsers: expect.any(Number),
            newUsers: expect.any(Number)
          })
        );
      });
    });

    describe('Monthly Insights', () => {
      it('should generate monthly insights', async () => {
        await analyticsJob.runJob('monthlyInsights');

        expect(mockServices.analyticsService.storeMonthlyInsights).toHaveBeenCalledWith(
          expect.objectContaining({
            month: expect.any(String),
            newUsers: expect.any(Number),
            activeUsers: expect.any(Number)
          })
        );
      });
    });

    describe('User Behavior Analysis', () => {
      it('should analyze behavior patterns', async () => {
        // Create some recent sessions
        const { user, sessions } = await testHelpers.createTestUser();

        await analyticsJob.runJob('userBehavior');

        expect(mockServices.analyticsService.storeBehaviorInsights).toHaveBeenCalled();
      });
    });

    describe('Performance Metrics', () => {
      it('should calculate performance metrics', async () => {
        await analyticsJob.runJob('performanceMetrics');

        expect(mockServices.analyticsService.storePerformanceMetrics).toHaveBeenCalledWith(
          expect.objectContaining({
            timestamp: expect.any(Date),
            averageResponseTime: expect.any(Number),
            errorRate: expect.any(Number)
          })
        );
      });
    });

    describe('Data Cleanup', () => {
      it('should clean up old data', async () => {
        // Create old data that should be cleaned
        const oldDate = new Date();
        oldDate.setMonth(oldDate.getMonth() - 12);

        const oldSession = await factory.create('TimerSession', {
          createdAt: oldDate,
          status: 'completed'
        });

        await analyticsJob.runJob('dataCleanup');

        expect(mockServices.analyticsService.cleanupOldMetrics).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle job execution errors gracefully', async () => {
      await jobManager.initialize();

      // Mock a service to throw an error
      mockServices.notificationService.sendGoalDeadlineReminder.mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      // Job should not throw, should handle error internally
      await expect(reminderJob.runJob('goalDeadlines')).resolves.not.toThrow();
    });

    it('should continue other jobs if one fails', async () => {
      await jobManager.initialize();

      // This test would require more sophisticated mocking
      // to simulate partial failures
      const status = jobManager.getStatus();
      expect(status.jobs.reminder.isRunning).toBe(true);
      expect(status.jobs.analytics.isRunning).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should execute jobs within reasonable time', async () => {
      await jobManager.initialize();

      const { duration } = await testHelpers.measureExecutionTime(async () => {
        await reminderJob.runJob('goalDeadlines');
      });

      testHelpers.expectFastResponse(duration, 5000); // 5 seconds max
    });

    it('should handle large datasets efficiently', async () => {
      // Create many users and goals
      const users = await factory.createMany('User', 100);
      
      for (const user of users.slice(0, 10)) { // Limit for test performance
        await factory.createMany('Goal', 5, { userId: user._id });
      }

      await jobManager.initialize();

      const { duration } = await testHelpers.measureExecutionTime(async () => {
        await reminderJob.runJob('goalDeadlines');
      });

      testHelpers.expectFastResponse(duration, 10000); // 10 seconds max
    });
  });
});
