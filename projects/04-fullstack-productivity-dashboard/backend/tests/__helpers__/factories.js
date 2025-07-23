/**
 * Test Data Factories
 * Generates consistent test data for testing
 */

const { Factory } = require('factory-girl');
const faker = require('faker');
const User = require('../../src/models/User');
const Goal = require('../../src/models/Goal');
const TimerSession = require('../../src/models/TimerSession');

const factory = new Factory();

// User Factory
factory.define('User', User, {
  name: () => faker.name.findName(),
  email: () => faker.internet.email().toLowerCase(),
  password: () => '$2a$10$rOlmjfOkfk5D8yKlq7XvY.5kG8j9j5jOy7XvY7XvY7XvY7XvY7XvY7', // 'password123'
  isVerified: true,
  role: 'user',
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      inApp: true
    },
    timerSettings: {
      pomodoroDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundEnabled: true
    }
  },
  notificationPreferences: {
    goalReminders: true,
    dailyCheckins: true,
    weeklyReports: true,
    monthlyReports: true,
    general: true
  },
  createdAt: () => faker.date.past(),
  lastLoginAt: () => faker.date.recent()
});

// Admin User Factory
factory.define('AdminUser', User, {
  name: 'Admin User',
  email: 'admin@test.com',
  password: '$2a$10$rOlmjfOkfk5D8yKlq7XvY.5kG8j9j5jOy7XvY7XvY7XvY7XvY7XvY7',
  role: 'admin',
  isVerified: true,
  createdAt: () => new Date(),
  lastLoginAt: () => new Date()
});

// Goal Factory
factory.define('Goal', Goal, {
  title: () => faker.lorem.sentence(),
  description: () => faker.lorem.paragraph(),
  category: () => faker.random.arrayElement(['work', 'personal', 'health', 'learning', 'other']),
  priority: () => faker.random.arrayElement(['low', 'medium', 'high']),
  status: 'active',
  progress: () => faker.datatype.number({ min: 0, max: 100 }),
  targetValue: () => faker.datatype.number({ min: 1, max: 100 }),
  currentValue: () => faker.datatype.number({ min: 0, max: 50 }),
  unit: () => faker.random.arrayElement(['tasks', 'hours', 'days', 'sessions', 'points']),
  dueDate: () => faker.date.future(),
  tags: () => [faker.lorem.word(), faker.lorem.word()],
  createdAt: () => faker.date.past(),
  updatedAt: () => faker.date.recent()
});

// Completed Goal Factory
factory.define('CompletedGoal', Goal, {
  status: 'completed',
  progress: 100,
  completedAt: () => faker.date.recent()
});

// TimerSession Factory
factory.define('TimerSession', TimerSession, {
  timerType: () => faker.random.arrayElement(['pomodoro', 'shortBreak', 'longBreak', 'custom']),
  duration: () => faker.datatype.number({ min: 300, max: 3000 }), // 5-50 minutes in seconds
  actualDuration: function() { return this.duration + faker.datatype.number({ min: -60, max: 60 }); },
  status: 'completed',
  startedAt: () => faker.date.recent(),
  endedAt: function() { 
    const started = this.startedAt || new Date();
    return new Date(started.getTime() + (this.duration * 1000));
  },
  breakTaken: () => faker.datatype.boolean(),
  notes: () => faker.random.arrayElement([null, faker.lorem.sentence()]),
  settings: {
    autoStartBreak: false,
    notificationsEnabled: true,
    soundEnabled: true
  },
  createdAt: () => faker.date.past(),
  updatedAt: () => faker.date.recent()
});

// Active TimerSession Factory
factory.define('ActiveTimerSession', TimerSession, {
  status: 'running',
  startedAt: () => new Date(Date.now() - 10 * 60 * 1000), // Started 10 minutes ago
  endedAt: null,
  actualDuration: null
});

// Factory Helper Functions
const factories = {
  // Create user with goals
  async createUserWithGoals(goalCount = 3) {
    const user = await factory.create('User');
    const goals = await factory.createMany('Goal', goalCount, { userId: user._id });
    return { user, goals };
  },

  // Create user with timer sessions
  async createUserWithSessions(sessionCount = 5) {
    const user = await factory.create('User');
    const sessions = await factory.createMany('TimerSession', sessionCount, { userId: user._id });
    return { user, sessions };
  },

  // Create complete user profile
  async createCompleteUser() {
    const user = await factory.create('User');
    const goals = await factory.createMany('Goal', 3, { userId: user._id });
    const completedGoals = await factory.createMany('CompletedGoal', 2, { userId: user._id });
    const sessions = await factory.createMany('TimerSession', 10, { userId: user._id });
    
    return {
      user,
      goals: [...goals, ...completedGoals],
      sessions
    };
  },

  // Create admin user
  async createAdmin() {
    return await factory.create('AdminUser');
  },

  // Create test data for specific scenarios
  async createInactiveUser() {
    return await factory.create('User', {
      lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    });
  },

  async createGoalWithUpcomingDeadline() {
    return await factory.create('Goal', {
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'active',
      progress: 60
    });
  },

  async createLongRunningSession() {
    return await factory.create('ActiveTimerSession', {
      startedAt: new Date(Date.now() - 60 * 60 * 1000), // Started 1 hour ago
      duration: 25 * 60 // 25 minutes planned
    });
  }
};

// Setup function to register all factories
function setupFactories() {
  // Make factories globally available in tests
  global.factory = factory;
  global.factories = factories;
  
  // Make faker available globally
  global.faker = faker;
}

module.exports = {
  factory,
  factories,
  setupFactories
};
