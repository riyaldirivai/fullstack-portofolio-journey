/**
 * Services Index
 * 
 * Central export point for all API-related services and utilities
 * Provides clean import paths and organized access to the complete API layer
 */

// Core HTTP Client
export { httpClient } from './httpClient';
export type { ApiResponse } from './httpClient';

// API Services
export { 
  apiServices,
  AuthService,
  GoalsService,
  TimerService,
  AnalyticsService,
  DashboardService,
  SettingsService,
} from './apiServices';

export type {
  User,
  Goal,
  SubGoal,
  TimerSession,
  AnalyticsData,
  DashboardSummary,
} from './apiServices';

// Redux Integration
export {
  reduxActions,
  AuthActions,
  GoalsActions,
  TimerActions,
  AnalyticsActions,
  DashboardActions,
  SettingsActions,
} from './reduxIntegration';

// Re-export types for convenience
export type {
  User as ReduxUser,
  Goal as ReduxGoal,
  TimerSession as ReduxTimerSession,
  AnalyticsData as ReduxAnalyticsData,
  DashboardSummary as ReduxDashboardSummary,
} from './reduxIntegration';

// Import for internal use
import { httpClient } from './httpClient';
import { apiServices } from './apiServices';
import { reduxActions } from './reduxIntegration';

/**
 * Quick Start API
 * Convenience methods for common operations
 */
export const api = {
  // Authentication shortcuts
  login: (email: string, password: string) => reduxActions.auth.login(email, password),
  logout: () => reduxActions.auth.logout(),
  register: (userData: { email: string; password: string; name: string }) => 
    reduxActions.auth.register(userData),

  // Goals shortcuts
  getGoals: (params?: any) => reduxActions.goals.fetchGoals(params),
  createGoal: (goalData: any) => reduxActions.goals.createGoal(goalData),
  updateGoal: (id: string, updates: any) => reduxActions.goals.updateGoal(id, updates),
  deleteGoal: (id: string) => reduxActions.goals.deleteGoal(id),

  // Timer shortcuts
  startTimer: (sessionData: any) => reduxActions.timer.createSession(sessionData),
  updateTimer: (id: string, updates: any) => reduxActions.timer.updateSession(id, updates),
  getTimerStats: (period?: string) => reduxActions.timer.getStatistics(period),

  // Dashboard shortcuts
  getDashboard: () => reduxActions.dashboard.fetchSummary(),
  refreshApp: () => reduxActions.refreshData(),

  // Utility shortcuts
  isLoading: (actionType: string) => reduxActions.isLoading(actionType),
  getError: (actionType: string) => reduxActions.getError(actionType),
  clearError: (actionType: string) => reduxActions.clearError(actionType),
  
  // Health check
  healthCheck: () => apiServices.healthCheck(),
};

/**
 * Development utilities
 */
export const devUtils = {
  // Inspect current API state
  inspectApiState: () => {
    console.group('🔍 API State Inspection');
    
    const token = localStorage.getItem('authToken');
    console.log('Auth Token:', token ? '✅ Present' : '❌ Missing');
    
    console.log('HTTP Client Config:', {
      baseURL: (httpClient as any).baseURL,
      timeout: (httpClient as any).timeout,
      hasAuthToken: !!(httpClient as any).authToken,
    });
    
    console.groupEnd();
  },

  // Test API connectivity
  testConnectivity: async () => {
    console.group('🧪 API Connectivity Test');
    
    try {
      const response = await apiServices.healthCheck();
      console.log('Health Check:', response.healthy ? '✅ Healthy' : '❌ Failed', response);
    } catch (error) {
      console.error('Health Check Error:', error);
    }
    
    console.groupEnd();
  },

  // Mock API responses (for development)
  enableMocking: (mockResponses: Record<string, any>) => {
    console.warn('🎭 API Mocking enabled - not for production use');
    // Implementation would go here for development mocking
  },
};

// Export everything as default for convenience
const services = {
  httpClient,
  apiServices,
  reduxActions,
  api,
  devUtils,
};

export default services;
