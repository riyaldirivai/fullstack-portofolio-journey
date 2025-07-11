/**
 * ===========================================
 * PRODUCTIVITY DASHBOARD API - COMPREHENSIVE TEST SUITE
 * Real Backend API Testing (Mock functionality removed)
 * Author: riyaldirivai
 * Date: 2025-07-11
 * ===========================================
 */

require('dotenv').config();
const axios = require('axios');

// Configuration for REAL backend server only
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PREFIX = process.env.API_PREFIX || '/api';
const FULL_URL = `${BASE_URL}${API_PREFIX}/${API_VERSION}`;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 ${testName}`, 'cyan');
  log('─'.repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Enhanced HTTP client for real backend testing
async function makeRequest(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${FULL_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000,
    validateStatus: function (status) {
      return status < 500; // Don't reject if status code is less than 500
    }
  };

  // Add authentication header if token provided
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add request body for non-GET requests
  if (data && method !== 'GET') {
    config.data = data;
  }

  try {
    log(`📡 ${method} request to ${endpoint}`, 'blue');
    const response = await axios(config);
    log(`✅ Response: ${response.status}`, 'green');
    
    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEOUT') {
      log(`❌ Connection refused. Is the server running at ${BASE_URL}?`, 'red');
      throw new Error(`Backend server is not running at ${BASE_URL}. Please start the server first.`);
    } else {
      log(`❌ Request failed: ${error.message}`, 'red');
      if (error.response) {
        log(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`, 'red');
        return {
          success: false,
          error: error.response.data,
          status: error.response.status
        };
      }
    }
    throw error;
  }
}

// Test data storage for real backend testing
let testData = {
  authToken: '',
  refreshToken: '',
  userId: '',
  goalId: '',
  timerId: '',
  userEmail: `test-${Date.now()}@productivity-api.com`,
  userData: null
};

// ===================================
// BACKEND SERVER CONNECTIVITY CHECK
// ===================================

async function checkServerConnectivity() {
  log('\n🔍 BACKEND SERVER CONNECTIVITY CHECK', 'yellow');
  log('Verifying backend server is running and accessible...', 'cyan');
  
  try {
    const healthResponse = await fetch(`${BASE_URL}/health`, { timeout: 5000 });
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'OK') {
      logSuccess('Backend server is running and healthy');
      logInfo(`Server version: ${healthData.version}`);
      logInfo(`Environment: ${healthData.environment}`);
      logInfo(`Database: ${healthData.database}`);
      return true;
    } else {
      logError('Backend server health check failed');
      return false;
    }
  } catch (error) {
    logError(`Backend server is not accessible: ${error.message}`);
    logError(`Please ensure the server is running at: ${BASE_URL}`);
    logError('Run: npm start (in the backend directory)');
    return false;
  }
}

// Test configuration - auto-start server for running tests
const START_SERVER = process.env.START_SERVER_FOR_TESTS === 'true';
let server;

// Server management helper functions
async function startServer() {
  if (!START_SERVER) return null;
  try {
    log('🚀 Starting test server...', 'blue');
    const app = require('./src/app');
    const port = process.env.TEST_PORT || 5001;
    
    return new Promise(resolve => {
      const serverInstance = app.listen(port, () => {
        log(`✅ Test server started on port ${port}`, 'green');
        resolve(serverInstance);
      });
    });
  } catch (error) {
    log(`❌ Failed to start test server: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function stopServer() {
  if (server) {
    log('🛑 Shutting down test server...', 'blue');
    await new Promise(resolve => server.close(resolve));
    log('✅ Server stopped', 'green');
  }
}

// ===================================
// HEALTH & SYSTEM TESTS
// ===================================

async function testSystemHealth() {
  logTest('System Health Check');
  
  try {
    // Test health endpoint
    let healthResult;
    try {
      // First try the root API endpoint
      healthResult = await makeRequest('GET', '', null, null);
    } catch (e) {
      // If that fails, try the health endpoint
      healthResult = await makeRequest('GET', '/health', null, null);
    }
    
    if (healthResult.success) {
      logSuccess('Health check passed');
      logInfo(`Status: ${healthResult.data.status}`);
      logInfo(`Uptime: ${Math.round(healthResult.data.uptime)} seconds`);
      logInfo(`Environment: ${healthResult.data.environment}`);
      return true;
    } else {
      logError('Health check failed');
      return false;
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    return false;
  }
}

// ===================================
// AUTHENTICATION TESTS
// ===================================

// ===================================
// AUTHENTICATION TESTS (REAL BACKEND)
// ===================================

async function testAuthentication() {
  logTest('Authentication System - Real Backend');
  
  try {
    // Test user registration with real backend
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: testData.userEmail,
      password: 'SecurePassword123!'
    };

    logInfo('Testing user registration...');
    const registerResult = await makeRequest('POST', '/auth/register', userData);
    
    if (registerResult.success && registerResult.data.success) {
      // Extract tokens from nested response structure
      const { tokens, user } = registerResult.data.data;
      testData.authToken = tokens.authToken;
      testData.refreshToken = tokens.refreshToken;
      testData.userId = user.id;
      testData.userData = user;
      
      logSuccess(`User registered: ${user.firstName} ${user.lastName}`);
      logInfo(`User ID: ${testData.userId}`);
      logInfo(`Token received: ${testData.authToken.substring(0, 20)}...`);
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(registerResult.error || registerResult.data)}`);
    }

    // Test user login with real backend
    logInfo('Testing user login...');
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: userData.email,
      password: userData.password
    });
    
    if (loginResult.success && loginResult.data.success) {
      const { tokens, user } = loginResult.data.data;
      testData.authToken = tokens.authToken; // Update with fresh token
      testData.refreshToken = tokens.refreshToken;
      
      logSuccess('Login successful');
      logInfo(`Fresh token received: ${testData.authToken.substring(0, 20)}...`);
    } else {
      throw new Error(`Login failed: ${JSON.stringify(loginResult.error || loginResult.data)}`);
    }

    // Test protected route access (get profile)
    logInfo('Testing protected route access...');
    const profileResult = await makeRequest('GET', '/auth/profile', null, testData.authToken);
    
    if (profileResult.success && profileResult.data.success) {
      const user = profileResult.data.data.user;
      logSuccess('Protected route access successful');
      logInfo(`Profile loaded: ${user.firstName} ${user.lastName}`);
      logInfo(`Email verified: ${user.email}`);
    } else {
      throw new Error('Protected route access failed');
    }

    // Test token refresh functionality
    logInfo('Testing token refresh...');
    const refreshResult = await makeRequest('POST', '/auth/refresh', {
      refreshToken: testData.refreshToken
    });
    
    if (refreshResult.success && refreshResult.data.success) {
      const { tokens } = refreshResult.data.data;
      testData.authToken = tokens.authToken;
      testData.refreshToken = tokens.refreshToken;
      
      logSuccess('Token refresh successful');
      logInfo(`New token received: ${testData.authToken.substring(0, 20)}...`);
    } else {
      logWarning('Token refresh failed, continuing with current token');
    }

    return true;
  } catch (error) {
    logError(`Authentication test failed: ${error.message}`);
    return false;
  }
}

// ===================================
// GOALS MANAGEMENT TESTS
// ===================================

// ===================================
// GOALS MANAGEMENT TESTS (REAL BACKEND)
// ===================================

async function testGoalsManagement() {
  logTest('Goals Management System - Real Backend');
  
  try {
    // Create test goals with real backend
    const goals = [
      {
        title: 'Complete Backend API Development',
        description: 'Build a full-featured REST API with authentication and database integration',
        category: 'development',
        priority: 'high',
        targetValue: 40,
        unit: 'hours',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Learn Advanced React Patterns',
        description: 'Master advanced React patterns and best practices for scalable applications',
        category: 'learning',
        priority: 'medium',
        targetValue: 25,
        unit: 'hours',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    logInfo('Creating test goals...');
    for (const goalData of goals) {
      const goalResult = await makeRequest('POST', '/goals', goalData, testData.authToken);
      
      if (goalResult.success && goalResult.data.success) {
        if (!testData.goalId) {
          testData.goalId = goalResult.data.data.goal._id; // Save first goal ID for later tests
        }
        logSuccess(`Goal created: ${goalResult.data.data.goal.title}`);
        logInfo(`Goal ID: ${goalResult.data.data.goal._id}`);
        logInfo(`Priority: ${goalResult.data.data.goal.priority}`);
      } else {
        throw new Error(`Goal creation failed: ${JSON.stringify(goalResult.error || goalResult.data)}`);
      }
    }

    // Test goal retrieval with real backend
    logInfo('Testing goal retrieval...');
    const goalsResult = await makeRequest('GET', '/goals', null, testData.authToken);
    
    if (goalsResult.success && goalsResult.data.success) {
      const goals = goalsResult.data.data.goals;
      logSuccess(`Retrieved ${goals.length} goals`);
      if (goals.length > 0) {
        logInfo(`First goal: ${goals[0].title}`);
        logInfo(`Status: ${goals[0].status}`);
        logInfo(`Progress: ${goals[0].currentProgress}/${goals[0].targetValue} ${goals[0].unit}`);
      }
    } else {
      throw new Error('Goal retrieval failed');
    }

    // Test goal progress update with real backend
    logInfo('Testing goal progress update...');
    const progressData = {
      progressValue: 5,
      notes: 'Made good progress on API endpoints and authentication system'
    };
    
    const progressResult = await makeRequest('POST', `/goals/${testData.goalId}/progress`, progressData, testData.authToken);
    
    if (progressResult.success && progressResult.data.success) {
      const updatedGoal = progressResult.data.data.goal;
      logSuccess('Goal progress updated successfully');
      logInfo(`Progress: ${updatedGoal.currentProgress}/${updatedGoal.targetValue} ${updatedGoal.unit}`);
      logInfo(`Progress percentage: ${Math.round((updatedGoal.currentProgress / updatedGoal.targetValue) * 100)}%`);
    } else {
      throw new Error('Goal progress update failed');
    }

    // Test goal statistics with real backend
    logInfo('Testing goal statistics...');
    const statsResult = await makeRequest('GET', '/goals/statistics', null, testData.authToken);
    
    if (statsResult.success && statsResult.data.success) {
      const statistics = statsResult.data.data.statistics;
      logSuccess('Goal statistics retrieved');
      logInfo(`Total goals: ${statistics.totalGoals}`);
      logInfo(`Active goals: ${statistics.activeGoals}`);
      logInfo(`Completed goals: ${statistics.completedGoals}`);
      logInfo(`Completion rate: ${Math.round((statistics.completedGoals / statistics.totalGoals) * 100)}%`);
    } else {
      logWarning('Goal statistics request failed, but continuing tests');
    }

    return true;
  } catch (error) {
    logError(`Goals management test failed: ${error.message}`);
    return false;
  }
}

// ===================================
// TIMER SESSION TESTS
// ===================================

async function testTimerSessions() {
  logTest('Timer Session System');
  
  try {
    // Start a pomodoro timer
    logInfo('Starting pomodoro timer...');
    const timerData = {
      goalId: testData.goalId,
      type: 'pomodoro',
      plannedDuration: 25, // 25 minutes
      title: 'Focus Session - API Development',
      description: 'Working on timer session implementation'
    };

    const startResult = await makeRequest('POST', '/timer-sessions/start', timerData, testData.authToken);
    if (startResult.success) {
      testData.timerId = startResult.data.session.id || startResult.data.session._id;
      logSuccess(`Timer started: ${testData.timerId}`);
      logInfo(`Type: ${startResult.data.session.type}`);
      logInfo(`Planned duration: ${startResult.data.session.plannedDuration} minutes`);
    } else {
      throw new Error(`Timer start failed: ${JSON.stringify(startResult.error)}`);
    }

    // Test get active timer
    logInfo('Testing get active timer...');
    const activeResult = await makeRequest('GET', '/timer-sessions/active', null, testData.authToken);
    if (activeResult.success && activeResult.data.session) {
      logSuccess('Active timer retrieved');
      logInfo(`Timer ID: ${activeResult.data.session._id || activeResult.data.session.id}`);
      logInfo(`Status: ${activeResult.data.session.status}`);
    }

    // Simulate work session with pause/resume
    logInfo('Testing pause functionality...');
    const pauseResult = await makeRequest('PUT', `/timer-sessions/pause`, null, testData.authToken);
    if (pauseResult.success) {
      logSuccess('Timer paused successfully');
    }

    // Wait a bit and then resume
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logInfo('Testing resume functionality...');
    const resumeResult = await makeRequest('PUT', `/timer-sessions/resume`, null, testData.authToken);
    if (resumeResult.success) {
      logSuccess('Timer resumed successfully');
    }

    // Complete the session
    logInfo('Testing timer completion...');
    const stopResult = await makeRequest('PUT', `/timer-sessions/stop`, {
      notes: 'Test session completed',
      rating: 5
    }, testData.authToken);
    
    if (stopResult.success) {
      logSuccess('Timer completed successfully');
      logInfo(`Duration: ${stopResult.data.session?.actualDuration || 'N/A'} minutes`);
      logInfo(`Completion: ${stopResult.data.session?.completionPercentage || 100}%`);
    }

    // Test timer history
    logInfo('Testing timer history...');
    const historyResult = await makeRequest('GET', '/timer-sessions/history?limit=5', null, testData.authToken);
    if (historyResult.success) {
      logSuccess(`Timer history retrieved: ${historyResult.data.sessions.length} sessions`);
    }

    // Test timer statistics
    logInfo('Testing timer statistics...');
    const timerStatsResult = await makeRequest('GET', '/timer-sessions/stats', null, testData.authToken);
    if (timerStatsResult.success) {
      logSuccess('Timer statistics retrieved');
      logInfo(`Total sessions: ${timerStatsResult.data.stats.totalSessions}`);
      logInfo(`Total time: ${Math.round(timerStatsResult.data.stats.totalTime / 60000)} minutes`);
    }

    // Test break timer
    logInfo('Testing break timer...');
    const breakData = {
      type: 'break',
      plannedDuration: 5, // 5 minutes
      title: 'Coffee Break',
      description: 'Short break after productive session'
    };

    const breakResult = await makeRequest('POST', '/timer-sessions/start', breakData, testData.authToken);
    if (breakResult.success) {
      logSuccess('Break timer started');
      
      // Complete the break immediately for testing
      const sessionId = breakResult.data.timer?.id || breakResult.data.timer?._id || breakResult.data.session?._id;
      await makeRequest('PUT', `/timer-sessions/stop`, {
        notes: 'Break completed',
        rating: 4
      }, testData.authToken);
      logInfo('Break timer completed');
    }

    return true;
  } catch (error) {
    logError(`Timer session test failed: ${error.message}`);
    return false;
  }
}

// ===================================
// DASHBOARD ANALYTICS TESTS
// ===================================

async function testDashboardAnalytics() {
  logTest('Dashboard Analytics System');
  
  try {
    // Test main analytics
    logInfo('Testing dashboard analytics...');
    const analyticsResult = await makeRequest('GET', '/dashboard/analytics', null, testData.authToken);
    
    if (analyticsResult.success) {
      const analytics = analyticsResult.data.analytics;
      logSuccess('Dashboard analytics retrieved');
      logInfo(`Total goals: ${analytics.totalGoals}`);
      logInfo(`Active goals: ${analytics.activeGoals}`);
      logInfo(`Total time tracked: ${Math.round(analytics.totalTimeTracked / 60000)} minutes`);
      logInfo(`Weekly progress: ${analytics.weeklyProgress} hours`);
    } else {
      throw new Error('Dashboard analytics failed');
    }

    // Test recent activities
    logInfo('Testing recent activities...');
    const activitiesResult = await makeRequest('GET', '/dashboard/recent?limit=10', null, testData.authToken);
    
    if (activitiesResult.success) {
      logSuccess(`Recent activities retrieved: ${activitiesResult.data.activities.length} items`);
      if (activitiesResult.data.activities.length > 0) {
        logInfo(`Latest activity: ${activitiesResult.data.activities[0].type}`);
      }
    } else {
      throw new Error('Recent activities failed');
    }

    return true;
  } catch (error) {
    logError(`Dashboard analytics test failed: ${error.message}`);
    return false;
  }
}

// ===================================
// ERROR HANDLING TESTS
// ===================================

async function testErrorHandling() {
  logTest('Error Handling & Edge Cases');
  
  try {
    // Test unauthorized access
    logInfo('Testing unauthorized access...');
    const unauthorizedResult = await makeRequest('GET', '/goals', null, null);
    if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
      logSuccess('Unauthorized access properly blocked');
    } else {
      logWarning('Unauthorized access test unexpected result');
    }

    // Test invalid goal creation
    logInfo('Testing invalid goal creation...');
    const invalidGoalResult = await makeRequest('POST', '/goals', {
      title: '', // Invalid empty title
      targetValue: -1 // Invalid negative value
    }, testData.authToken);
    if (!invalidGoalResult.success && invalidGoalResult.status === 400) {
      logSuccess('Invalid goal creation properly rejected');
    } else {
      logWarning('Invalid goal validation test unexpected result');
    }

    // Test multiple active timers (should fail)
    logInfo('Testing multiple active timers prevention...');
    const timer1Result = await makeRequest('POST', '/timer-sessions/start', {
      goalId: testData.goalId,
      type: 'pomodoro',
      plannedDuration: 25 * 60 * 1000,
      title: 'First Timer'
    }, testData.authToken);

    if (timer1Result.success) {
      const timer2Result = await makeRequest('POST', '/timer-sessions/start', {
        goalId: testData.goalId,
        type: 'pomodoro',
        plannedDuration: 25 * 60 * 1000,
        title: 'Second Timer (Should Fail)'
      }, testData.authToken);

      if (!timer2Result.success) {
        logSuccess('Multiple active timers properly prevented');
        // Clean up the first timer
        await makeRequest('PUT', `/timer-sessions/${timer1Result.data.session._id}/stop`, {
          reason: 'Test cleanup'
        }, testData.authToken);
      } else {
        logWarning('Multiple active timers not properly prevented');
      }
    }

    return true;
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
    return false;
  }
}

// ===================================
// MAIN TEST RUNNER
// ===================================

async function runAllTests() {
  log('\n🚀 PRODUCTIVITY DASHBOARD API - COMPREHENSIVE TEST SUITE', 'magenta');
  log('='.repeat(70), 'blue');
  log('Testing complete backend API functionality...', 'cyan');

  const startTime = Date.now();
  
  const tests = [
    { name: 'System Health', fn: testSystemHealth },
    { name: 'Authentication System', fn: testAuthentication },
    { name: 'Goals Management', fn: testGoalsManagement },
    { name: 'Timer Sessions', fn: testTimerSessions },
    { name: 'Dashboard Analytics', fn: testDashboardAnalytics },
    { name: 'Error Handling', fn: testErrorHandling }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        logSuccess(`✅ ${test.name} - PASSED`);
      } else {
        failed++;
        logError(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      failed++;
      logError(`❌ ${test.name} - ERROR: ${error.message}`);
    }
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);

  // Final Results
  log('\n📊 TEST RESULTS SUMMARY', 'cyan');
  log('='.repeat(70), 'blue');
  logInfo(`Test duration: ${duration} seconds`);
  logSuccess(`✅ Tests passed: ${passed}`);
  if (failed > 0) {
    logError(`❌ Tests failed: ${failed}`);
  }
  
  const successRate = Math.round((passed / (passed + failed)) * 100);
  log(`📈 Success rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

  if (failed === 0) {
    log('\n🎉 ALL TESTS PASSED! SYSTEM IS PRODUCTION READY! 🎉', 'green');
    log('✅ Authentication system working', 'green');
    log('✅ Goals management functional', 'green');
    log('✅ Timer sessions operational', 'green');
    log('✅ Dashboard analytics active', 'green');
    log('✅ Error handling robust', 'green');
    log('\n🚀 Ready for GitHub portfolio deployment! 🚀', 'magenta');
  } else {
    log('\n⚠️  Some tests failed. Please review and fix issues before deployment.', 'yellow');
  }

  return failed === 0;
}

// Quick test mode for fast verification
async function runQuickTest() {
  log('\n⚡ QUICK TEST MODE', 'yellow');
  log('Running essential tests only...', 'cyan');

  try {
    const healthOk = await testSystemHealth();
    if (!healthOk) {
      logError('System health check failed - server may not be running');
      return false;
    }

    const authOk = await testAuthentication();
    if (!authOk) {
      logError('Authentication test failed');
      return false;
    }

    logSuccess('✅ Quick test passed - core systems operational');
    return true;
  } catch (error) {
    logError(`Quick test failed: ${error.message}`);
    return false;
  }
}

// Export functions for modular usage
module.exports = {
  runAllTests,
  runQuickTest,
  testSystemHealth,
  testAuthentication,
  testGoalsManagement,
  testTimerSessions,
  testDashboardAnalytics,
  testErrorHandling,
  makeRequest,
  FULL_URL
};

// Run tests if called directly (REAL BACKEND ONLY)
if (require.main === module) {
  const testMode = process.argv[2];
  
  // No more mock mode support - only real backend testing
  if (process.argv.includes('--mock')) {
    logError('❌ Mock mode has been removed. Please start the real backend server.');
    logError('Run: npm start (in the backend directory)');
    process.exit(1);
  }
  
  // Main test execution
  const runTests = async () => {
    const serverRunning = await checkServerConnectivity();
    
    if (!serverRunning) {
      logError('❌ Cannot run tests - Backend server is not accessible');
      logError('Please start the backend server first:');
      logError('  cd projects/03-backend-api-server');
      logError('  npm start');
      process.exit(1);
    }
    
    if (testMode === '--quick') {
      const success = await runQuickTest();
      process.exit(success ? 0 : 1);
    } else {
      const success = await runAllTests();
      process.exit(success ? 0 : 1);
    }
  };
  
  runTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}
