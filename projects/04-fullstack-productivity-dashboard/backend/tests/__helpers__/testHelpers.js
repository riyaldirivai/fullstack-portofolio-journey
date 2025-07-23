/**
 * Test Helper Utilities
 * Common utilities for testing
 */

const jwt = require('jsonwebtoken');
const supertest = require('supertest');
const app = require('../../server');

const testHelpers = {
  // Create authenticated request
  async createAuthenticatedRequest(user) {
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      request: supertest(app).set('Authorization', `Bearer ${token}`)
    };
  },

  // Create admin request
  async createAdminRequest() {
    const admin = await factories.createAdmin();
    return await this.createAuthenticatedRequest(admin);
  },

  // Create regular user request
  async createUserRequest() {
    const user = await factory.create('User');
    return await this.createAuthenticatedRequest(user);
  },

  // Test API endpoint response structure
  expectAPIResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success');
    
    if (expectedStatus >= 200 && expectedStatus < 300) {
      expect(response.body.success).toBe(true);
    } else {
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
    }
  },

  // Test pagination response
  expectPaginatedResponse(response, expectedStatus = 200) {
    this.expectAPIResponse(response, expectedStatus);
    
    if (expectedStatus === 200) {
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');
    }
  },

  // Test validation errors
  expectValidationError(response, field) {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    
    if (field) {
      expect(response.body.error.toLowerCase()).toContain(field.toLowerCase());
    }
  },

  // Test authorization errors
  expectUnauthorizedError(response) {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
  },

  // Test forbidden errors
  expectForbiddenError(response) {
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
  },

  // Test not found errors
  expectNotFoundError(response) {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
  },

  // Create test data with relationships
  async createTestUser(options = {}) {
    const user = await factory.create('User', options);
    const goals = await factory.createMany('Goal', 2, { userId: user._id });
    const sessions = await factory.createMany('TimerSession', 3, { userId: user._id });
    
    return { user, goals, sessions };
  },

  // Wait for async operations
  async waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Mock time
  mockDate(date = new Date()) {
    const originalDate = global.Date;
    global.Date = jest.fn(() => date);
    global.Date.now = jest.fn(() => date.getTime());
    
    return () => {
      global.Date = originalDate;
    };
  },

  // Clean database collections
  async cleanDatabase() {
    const mongoose = require('mongoose');
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  },

  // Generate test email
  generateTestEmail() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
  },

  // Generate test ObjectId
  generateObjectId() {
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId();
  },

  // Test email sending (mock)
  expectEmailSent(mockEmailService, recipient, subject) {
    expect(mockEmailService.sendEmail).toHaveBeenCalled();
    
    const calls = mockEmailService.sendEmail.mock.calls;
    const relevantCall = calls.find(call => 
      call[0] === recipient && call[1].includes(subject)
    );
    
    expect(relevantCall).toBeDefined();
  },

  // Test notification sending (mock)
  expectNotificationSent(mockNotificationService, userId, type) {
    expect(mockNotificationService.send).toHaveBeenCalled();
    
    const calls = mockNotificationService.send.mock.calls;
    const relevantCall = calls.find(call => 
      call[0].toString() === userId.toString() && 
      call[1].type === type
    );
    
    expect(relevantCall).toBeDefined();
  },

  // Mock external services
  mockServices() {
    const emailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
      sendGoalReminder: jest.fn().mockResolvedValue(true),
      sendWeeklyReport: jest.fn().mockResolvedValue(true)
    };

    const notificationService = {
      send: jest.fn().mockResolvedValue(true),
      sendGoalDeadlineReminder: jest.fn().mockResolvedValue(true),
      sendBreakReminder: jest.fn().mockResolvedValue(true)
    };

    const analyticsService = {
      track: jest.fn().mockResolvedValue(true),
      storeDailyMetrics: jest.fn().mockResolvedValue(true),
      storeWeeklyMetrics: jest.fn().mockResolvedValue(true)
    };

    return {
      emailService,
      notificationService,
      analyticsService
    };
  },

  // Test data validation
  expectValidObjectId(value) {
    const mongoose = require('mongoose');
    expect(mongoose.Types.ObjectId.isValid(value)).toBe(true);
  },

  expectValidDate(value) {
    expect(value).toBeDefined();
    expect(new Date(value).toString()).not.toBe('Invalid Date');
  },

  expectValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(email)).toBe(true);
  },

  // Performance testing helpers
  async measureExecutionTime(asyncFunction) {
    const start = Date.now();
    const result = await asyncFunction();
    const duration = Date.now() - start;
    
    return { result, duration };
  },

  expectFastResponse(duration, maxMs = 200) {
    expect(duration).toBeLessThan(maxMs);
  }
};

// Make helpers globally available
global.testHelpers = testHelpers;

module.exports = testHelpers;
