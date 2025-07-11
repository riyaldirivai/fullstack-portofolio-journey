#!/usr/bin/env node

/**
 * Development Utility Script
 * Provides useful commands for development workflow
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const commands = {
  setup: setupProject,
  clean: cleanProject,
  reset: resetDatabase,
  docs: generateDocs,
  health: healthCheck,
  help: showHelp
};

function setupProject() {
  console.log('🚀 Setting up project...');
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Copy environment file if it doesn't exist
  if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file...');
    fs.copyFileSync('.env.example', '.env');
    console.log('⚠️  Please update .env with your actual configuration values');
  }
  
  // Create necessary directories
  const dirs = ['logs', 'uploads', 'temp'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}/`);
    }
  });
  
  console.log('✅ Project setup complete!');
  console.log('💡 Next steps:');
  console.log('   1. Update .env with your configuration');
  console.log('   2. Start MongoDB service');
  console.log('   3. Run: npm run seed');
  console.log('   4. Run: npm start');
}

function cleanProject() {
  console.log('🧹 Cleaning project...');
  
  // Clean logs
  if (fs.existsSync('logs')) {
    const logFiles = fs.readdirSync('logs').filter(f => f.endsWith('.log'));
    logFiles.forEach(file => {
      fs.unlinkSync(path.join('logs', file));
      console.log(`🗑️  Removed log: ${file}`);
    });
  }
  
  // Clean temp files
  if (fs.existsSync('temp')) {
    const tempFiles = fs.readdirSync('temp');
    tempFiles.forEach(file => {
      fs.unlinkSync(path.join('temp', file));
      console.log(`🗑️  Removed temp file: ${file}`);
    });
  }
  
  console.log('✅ Project cleaned!');
}

function resetDatabase() {
  console.log('🔄 Resetting database...');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
  }
}

function generateDocs() {
  console.log('📚 Generating API documentation...');
  // This would integrate with tools like JSDoc or swagger-jsdoc
  console.log('💡 API documentation is available in docs/API_ENDPOINTS.md');
  console.log('🌐 Start the server and visit /api-docs for interactive documentation');
}

function healthCheck() {
  console.log('🔍 Running health check...');
  try {
    execSync('npm run test:quick', { stdio: 'inherit' });
    console.log('✅ Health check passed!');
  } catch (error) {
    console.error('❌ Health check failed');
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🛠️  Productivity Dashboard API - Development Tools

Usage: node scripts/dev.js <command>

Commands:
  setup     📦 Set up the project (install deps, create .env, etc.)
  clean     🧹 Clean logs and temporary files
  reset     🔄 Reset database with sample data
  docs      📚 Generate/view API documentation
  health    🔍 Run health check and quick tests
  help      ❓ Show this help message

Examples:
  node scripts/dev.js setup
  node scripts/dev.js clean
  node scripts/dev.js reset

💡 Tip: You can also use npm scripts:
  npm run dev      - Start development server
  npm run test     - Run all tests
  npm run seed     - Seed database
  `);
}

// Parse command line arguments
const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command]();
} else {
  console.error(`❌ Unknown command: ${command}`);
  showHelp();
  process.exit(1);
}
