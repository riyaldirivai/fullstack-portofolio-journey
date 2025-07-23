/**
 * API Usage Examples
 * 
 * Demonstrates the complete request/response flow:
 * Component → Redux Action → API Service → HttpClient → Express Route → MongoDB → Response → Redux State Update → UI Update
 * 
 * These examples show how to use the API services with proper error handling,
 * loading states, and Redux integration.
 */

import { api, reduxActions } from './index';
import { store } from '../store';

/**
 * Example 1: Authentication Flow
 * Shows the complete login process with Redux integration
 */
export async function exampleLoginFlow() {
  console.group('🔐 Example: Complete Login Flow');
  
  try {
    // 1. Component triggers login
    console.log('Step 1: Component calls login action');
    const success = await api.login('user@example.com', 'password123');
    
    if (success) {
      console.log('Step 2: ✅ Login successful - Redux state updated');
      
      // 3. Check Redux state
      const authState = store.getState().auth;
      console.log('Step 3: Current auth state:', {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user?.email,
        hasToken: !!authState.token,
      });
      
      console.log('✅ Complete login flow successful');
    } else {
      console.log('❌ Login failed');
      const error = api.getError('AUTH_LOGIN');
      console.log('Error details:', error);
    }
  } catch (error) {
    console.error('Login flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Example 2: Goals Management Flow
 * Shows CRUD operations with automatic Redux updates
 */
export async function exampleGoalsFlow() {
  console.group('📋 Example: Goals Management Flow');
  
  try {
    // 1. Fetch existing goals
    console.log('Step 1: Fetching goals...');
    const fetchSuccess = await api.getGoals();
    
    if (fetchSuccess) {
      const goalsState = store.getState().goals;
      console.log(`Step 1: ✅ Loaded ${goalsState.goals.length} goals`);
      
      // 2. Create a new goal
      console.log('Step 2: Creating new goal...');
      const createSuccess = await api.createGoal({
        title: 'Complete API Integration',
        description: 'Finish the full-stack API communication layer',
        category: 'professional',
        priority: 'high',
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
      });
      
      if (createSuccess) {
        const updatedState = store.getState().goals;
        console.log(`Step 2: ✅ Goal created! Total goals: ${updatedState.goals.length}`);
        
        // 3. Update goal progress
        const newGoal = updatedState.goals[updatedState.goals.length - 1];
        console.log('Step 3: Updating goal progress...');
        
        const updateSuccess = await api.updateGoal(newGoal.id, { progress: 75 });
        if (updateSuccess) {
          console.log('Step 3: ✅ Goal progress updated to 75%');
        }
        
        console.log('✅ Complete goals flow successful');
      }
    }
  } catch (error) {
    console.error('Goals flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Example 3: Timer Session Flow
 * Shows timer management with real-time updates
 */
export async function exampleTimerFlow() {
  console.group('⏱️ Example: Timer Session Flow');
  
  try {
    // 1. Start a timer session
    console.log('Step 1: Starting timer session...');
    const startSuccess = await api.startTimer({
      type: 'pomodoro',
      duration: 25 * 60, // 25 minutes
      status: 'running',
      startTime: new Date().toISOString(),
      notes: 'Working on API integration',
    });
    
    if (startSuccess) {
      const timerState = store.getState().timer;
      console.log('Step 1: ✅ Timer started:', {
        sessionId: timerState.currentSession?.id,
        duration: timerState.currentSession?.duration,
        type: timerState.currentSession?.type,
      });
      
      // 2. Simulate timer update (progress)
      console.log('Step 2: Simulating timer progress...');
      const sessionId = timerState.currentSession?.id;
      
      if (sessionId) {
        const updateSuccess = await api.updateTimer(sessionId, {
          remainingTime: 20 * 60, // 20 minutes remaining
          status: 'running',
        });
        
        if (updateSuccess) {
          console.log('Step 2: ✅ Timer updated - 20 minutes remaining');
          
          // 3. Complete timer session
          console.log('Step 3: Completing timer session...');
          const completeSuccess = await api.updateTimer(sessionId, {
            status: 'completed',
            endTime: new Date().toISOString(),
            remainingTime: 0,
          });
          
          if (completeSuccess) {
            console.log('Step 3: ✅ Timer session completed successfully');
            
            // 4. Get updated statistics
            const statsSuccess = await api.getTimerStats('week');
            if (statsSuccess) {
              const stats = store.getState().timer.statistics;
              console.log('Step 4: ✅ Updated statistics:', stats);
            }
          }
        }
      }
      
      console.log('✅ Complete timer flow successful');
    }
  } catch (error) {
    console.error('Timer flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Example 4: Dashboard Data Flow
 * Shows comprehensive dashboard loading with multiple API calls
 */
export async function exampleDashboardFlow() {
  console.group('🏠 Example: Dashboard Data Flow');
  
  try {
    // 1. Load dashboard summary (combines multiple data sources)
    console.log('Step 1: Loading dashboard summary...');
    const dashboardSuccess = await api.getDashboard();
    
    if (dashboardSuccess) {
      const state = store.getState();
      console.log('Step 1: ✅ Dashboard loaded:', {
        userEmail: state.auth.user?.email,
        totalGoals: state.analytics.data?.overview?.totalGoals,
        todayFocusTime: state.timer.statistics?.totalFocusTime,
        currentStreak: state.timer.statistics?.currentStreak,
      });
      
      // 2. Check loading states
      console.log('Step 2: Checking loading states...');
      const loadingStates = {
        dashboard: api.isLoading('DASHBOARD_FETCH_SUMMARY'),
        goals: api.isLoading('GOALS_FETCH'),
        analytics: api.isLoading('ANALYTICS_FETCH_OVERVIEW'),
      };
      console.log('Loading states:', loadingStates);
      
      // 3. Check for any errors
      console.log('Step 3: Checking for errors...');
      const errors = {
        dashboard: api.getError('DASHBOARD_FETCH_SUMMARY'),
        goals: api.getError('GOALS_FETCH'),
        analytics: api.getError('ANALYTICS_FETCH_OVERVIEW'),
      };
      console.log('Error states:', errors);
      
      console.log('✅ Complete dashboard flow successful');
    }
  } catch (error) {
    console.error('Dashboard flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Example 5: Error Handling Flow
 * Shows how errors are handled throughout the system
 */
export async function exampleErrorHandlingFlow() {
  console.group('❌ Example: Error Handling Flow');
  
  try {
    // 1. Simulate an API call that will fail
    console.log('Step 1: Making API call that will fail...');
    const success = await api.updateGoal('invalid-id', { title: 'Test' });
    
    console.log('Step 2: API call result:', success ? 'Success' : 'Failed');
    
    // 2. Check error state
    const error = api.getError('GOALS_UPDATE');
    console.log('Step 3: Error details:', error);
    
    // 3. Check loading state (should be false after error)
    const isLoading = api.isLoading('GOALS_UPDATE');
    console.log('Step 4: Loading state:', isLoading);
    
    // 4. Clear the error
    console.log('Step 5: Clearing error...');
    api.clearError('GOALS_UPDATE');
    const clearedError = api.getError('GOALS_UPDATE');
    console.log('Step 6: Error after clearing:', clearedError);
    
    console.log('✅ Error handling flow completed');
  } catch (error) {
    console.error('Error handling flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Example 6: Real-time Data Refresh Flow
 * Shows how to refresh data across the application
 */
export async function exampleDataRefreshFlow() {
  console.group('🔄 Example: Data Refresh Flow');
  
  try {
    console.log('Step 1: Refreshing all application data...');
    await api.refreshApp();
    
    console.log('Step 2: Checking updated state...');
    const state = store.getState();
    
    const summary = {
      auth: {
        isAuthenticated: state.auth.isAuthenticated,
        user: state.auth.user?.email,
      },
      goals: {
        total: state.goals.goals.length,
        active: state.goals.goals.filter((g: any) => g.status === 'active').length,
      },
      timer: {
        sessionsCount: state.timer.sessions.length,
        hasStatistics: !!state.timer.statistics,
      },
      analytics: {
        hasOverview: !!state.analytics.data?.overview,
        hasTrends: !!state.analytics.data?.trends,
      },
    };
    
    console.log('Step 2: ✅ Application state summary:', summary);
    console.log('✅ Complete data refresh successful');
  } catch (error) {
    console.error('Data refresh flow exception:', error);
  }
  
  console.groupEnd();
}

/**
 * Run All Examples
 * Demonstrates the complete API system in action
 */
export async function runAllExamples() {
  console.log('🚀 Running All API Flow Examples...');
  console.log('Note: These examples assume a running backend server');
  
  // Wait between examples for clarity
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  await exampleLoginFlow();
  await wait(1000);
  
  await exampleGoalsFlow();
  await wait(1000);
  
  await exampleTimerFlow();
  await wait(1000);
  
  await exampleDashboardFlow();
  await wait(1000);
  
  await exampleErrorHandlingFlow();
  await wait(1000);
  
  await exampleDataRefreshFlow();
  
  console.log('🎉 All API flow examples completed!');
}

/**
 * Component Usage Example
 * Shows how a React component would use the API
 */
export const ComponentUsageExample = `
// React Component Example
import React, { useState, useEffect } from 'react';
import { api, reduxActions } from '../services';
import { useSelector } from 'react-redux';

function GoalsComponent() {
  const goals = useSelector(state => state.goals.items);
  const isLoading = useSelector(state => api.isLoading('GOALS_FETCH'));
  const error = useSelector(state => api.getError('GOALS_FETCH'));
  
  useEffect(() => {
    // Load goals when component mounts
    api.getGoals();
  }, []);
  
  const handleCreateGoal = async (goalData) => {
    const success = await api.createGoal(goalData);
    if (success) {
      console.log('Goal created successfully!');
    }
  };
  
  const handleUpdateProgress = async (goalId, progress) => {
    await api.updateGoal(goalId, { progress });
  };
  
  if (isLoading) return <div>Loading goals...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Goals ({goals.length})</h2>
      {goals.map(goal => (
        <div key={goal.id}>
          <h3>{goal.title}</h3>
          <p>Progress: {goal.progress}%</p>
          <button onClick={() => handleUpdateProgress(goal.id, goal.progress + 10)}>
            Update Progress
          </button>
        </div>
      ))}
      <button onClick={() => handleCreateGoal({
        title: 'New Goal',
        category: 'personal',
        priority: 'medium',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })}>
        Create Goal
      </button>
    </div>
  );
}
`;

// Export examples for easy access
export const examples = {
  login: exampleLoginFlow,
  goals: exampleGoalsFlow,
  timer: exampleTimerFlow,
  dashboard: exampleDashboardFlow,
  errorHandling: exampleErrorHandlingFlow,
  dataRefresh: exampleDataRefreshFlow,
  runAll: runAllExamples,
};

export default examples;
