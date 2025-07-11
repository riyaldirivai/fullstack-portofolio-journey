/**
 * Database Seeding Script
 * Seeds the database with sample data for development and testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');
const User = require('../src/models/User');
const Goal = require('../src/models/Goal');
const TimerSession = require('../src/models/TimerSession');

const logger = {
  info: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`)
};

// Sample users data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'Password123!'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'Password123!'
  }
];

// Sample goals data
const sampleGoals = [
  {
    title: 'Complete Full-Stack Project',
    description: 'Build a complete CRUD application with authentication',
    category: 'development',
    priority: 'high',
    targetValue: 40,
    unit: 'hours',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  {
    title: 'Learn React Hooks',
    description: 'Master useState, useEffect, and custom hooks',
    category: 'learning',
    priority: 'medium',
    targetValue: 20,
    unit: 'hours',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  },
  {
    title: 'Morning Meditation',
    description: 'Daily 15-minute meditation practice',
    category: 'wellness',
    priority: 'low',
    targetValue: 30,
    unit: 'sessions',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
];

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    logger.info('📊 Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Goal.deleteMany({});
    await TimerSession.deleteMany({});
    logger.info('🧹 Cleared existing data');

    // Create sample users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      logger.info(`👤 Created user: ${user.firstName} ${user.lastName}`);
    }

    // Create sample goals for each user
    const createdGoals = [];
    for (const user of createdUsers) {
      for (const goalData of sampleGoals) {
        const goal = new Goal({
          ...goalData,
          userId: user._id
        });
        await goal.save();
        createdGoals.push(goal);
        logger.info(`🎯 Created goal: ${goal.title} for ${user.firstName}`);
      }
    }

    // Create sample timer sessions
    for (let i = 0; i < 5; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomGoal = createdGoals.find(g => g.userId.equals(randomUser._id));
      
      if (randomGoal) {
        const session = new TimerSession({
          userId: randomUser._id,
          goalId: randomGoal._id,
          type: 'pomodoro',
          title: `Focus Session ${i + 1}`,
          startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          endTime: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000),
          plannedDuration: 25,
          actualDuration: Math.floor(20 + Math.random() * 10), // 20-30 minutes
          status: 'completed',
          completionPercentage: Math.floor(80 + Math.random() * 20), // 80-100%
          productivityRating: Math.floor(3 + Math.random() * 3), // 3-5 rating
          notes: `Productive session working on ${randomGoal.title}`
        });
        await session.save();
        logger.info(`⏱️  Created timer session for ${randomUser.firstName}`);
      }
    }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info(`📊 Summary:`);
    logger.info(`   - Users created: ${createdUsers.length}`);
    logger.info(`   - Goals created: ${createdGoals.length}`);
    logger.info(`   - Timer sessions created: 5`);

  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    logger.info('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
