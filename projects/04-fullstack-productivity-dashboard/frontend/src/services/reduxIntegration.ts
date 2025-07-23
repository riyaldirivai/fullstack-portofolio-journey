/**
 * Redux API Integration
 * 
 * Connects API services with Redux store following the complete flow:
 * Component → Redux Action → API Service → HttpClient → Express → MongoDB → Response → Redux State Update
 */

import { store } from '../store';
import { apiServices } from './apiServices';
import type { ApiResponse } from './httpClient';
import type { User, Goal, TimerSession, AnalyticsData, DashboardSummary } from './apiServices';

// Re-export types for convenience
export type { User, Goal, TimerSession, AnalyticsData, DashboardSummary };

/**
 * Generic async action handler
 * Automatically handles loading states, errors, and success states
 */
interface AsyncActionOptions<T> {
  actionType: string;
  apiCall: () => Promise<ApiResponse<T>>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  skipLoading?: boolean;
  skipErrorHandling?: boolean;
}

async function handleAsyncAction<T>({
  actionType,
  apiCall,
  onSuccess,
  onError,
  skipLoading = false,
  skipErrorHandling = false,
}: AsyncActionOptions<T>): Promise<ApiResponse<T>> {
  try {
    // Set loading state
    if (!skipLoading) {
      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: actionType, loading: true },
      });
    }

    // Clear previous errors
    if (!skipErrorHandling) {
      store.dispatch({
        type: 'ui/CLEAR_ERROR',
        payload: actionType,
      });
    }

    console.log(`🔄 Starting async action: ${actionType}`);

    // Make API call
    const response = await apiCall();

    if (response.success) {
      console.log(`✅ Async action success: ${actionType}`);
      
      // Call success handler
      if (onSuccess && response.data) {
        onSuccess(response.data);
      }
    } else {
      console.error(`❌ Async action failed: ${actionType}`, response.error);
      
      // Handle error
      if (!skipErrorHandling) {
        store.dispatch({
          type: 'ui/SET_ERROR',
          payload: { key: actionType, error: response.error },
        });
      }

      // Call error handler
      if (onError) {
        onError(response.error);
      }
    }

    return response;
  } catch (error) {
    console.error(`💥 Async action exception: ${actionType}`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    if (!skipErrorHandling) {
      store.dispatch({
        type: 'ui/SET_ERROR',
        payload: { key: actionType, error: errorMessage },
      });
    }

    if (onError) {
      onError(errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    // Clear loading state
    if (!skipLoading) {
      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: actionType, loading: false },
      });
    }
  }
}

/**
 * Authentication Actions with Redux Integration
 */
export class AuthActions {
  static async login(email: string, password: string): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'AUTH_LOGIN',
      apiCall: () => apiServices.auth.login(email, password),
      onSuccess: (data) => {
        store.dispatch({
          type: 'auth/LOGIN_SUCCESS',
          payload: {
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          },
        });
      },
    });

    return response.success;
  }

  static async register(userData: { email: string; password: string; name: string }): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'AUTH_REGISTER',
      apiCall: () => apiServices.auth.register(userData),
      onSuccess: (data) => {
        store.dispatch({
          type: 'auth/LOGIN_SUCCESS',
          payload: {
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          },
        });
      },
    });

    return response.success;
  }

  static async logout(): Promise<void> {
    await handleAsyncAction({
      actionType: 'AUTH_LOGOUT',
      apiCall: () => apiServices.auth.logout(),
      onSuccess: () => {
        store.dispatch({
          type: 'auth/LOGOUT',
        });
      },
      skipLoading: true,
    });
  }

  static async getProfile(): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'AUTH_GET_PROFILE',
      apiCall: () => apiServices.auth.getProfile(),
      onSuccess: (user) => {
        store.dispatch({
          type: 'auth/UPDATE_USER',
          payload: user,
        });
      },
      skipLoading: true,
    });

    return response.success;
  }

  static async updateProfile(updates: Partial<User>): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'AUTH_UPDATE_PROFILE',
      apiCall: () => apiServices.auth.updateProfile(updates),
      onSuccess: (user) => {
        store.dispatch({
          type: 'auth/UPDATE_USER',
          payload: user,
        });
      },
    });

    return response.success;
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'AUTH_CHANGE_PASSWORD',
      apiCall: () => apiServices.auth.changePassword(oldPassword, newPassword),
    });

    return response.success;
  }
}

/**
 * Goals Actions with Redux Integration
 */
export class GoalsActions {
  static async fetchGoals(params?: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_FETCH',
      apiCall: () => apiServices.goals.getAll(params),
      onSuccess: (goals) => {
        store.dispatch({
          type: 'goals/SET_GOALS',
          payload: goals,
        });
      },
    });

    return response.success;
  }

  static async createGoal(goalData: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_CREATE',
      apiCall: () => apiServices.goals.create(goalData),
      onSuccess: (goal) => {
        store.dispatch({
          type: 'goals/ADD_GOAL',
          payload: goal,
        });
      },
    });

    return response.success;
  }

  static async updateGoal(id: string, updates: Partial<Goal>): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_UPDATE',
      apiCall: () => apiServices.goals.update(id, updates),
      onSuccess: (goal) => {
        store.dispatch({
          type: 'goals/UPDATE_GOAL',
          payload: goal,
        });
      },
    });

    return response.success;
  }

  static async deleteGoal(id: string): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_DELETE',
      apiCall: () => apiServices.goals.delete(id),
      onSuccess: () => {
        store.dispatch({
          type: 'goals/REMOVE_GOAL',
          payload: id,
        });
      },
    });

    return response.success;
  }

  static async updateProgress(id: string, progress: number): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_UPDATE_PROGRESS',
      apiCall: () => apiServices.goals.updateProgress(id, progress),
      onSuccess: (goal) => {
        store.dispatch({
          type: 'goals/UPDATE_GOAL',
          payload: goal,
        });
      },
      skipLoading: true,
    });

    return response.success;
  }

  static async addSubGoal(goalId: string, subGoal: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'GOALS_ADD_SUBGOAL',
      apiCall: () => apiServices.goals.addSubGoal(goalId, subGoal),
      onSuccess: (goal) => {
        store.dispatch({
          type: 'goals/UPDATE_GOAL',
          payload: goal,
        });
      },
    });

    return response.success;
  }
}

/**
 * Timer Actions with Redux Integration
 */
export class TimerActions {
  static async fetchSessions(params?: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'TIMER_FETCH_SESSIONS',
      apiCall: () => apiServices.timer.getSessions(params),
      onSuccess: (sessions) => {
        store.dispatch({
          type: 'timer/SET_SESSIONS',
          payload: sessions,
        });
      },
    });

    return response.success;
  }

  static async createSession(sessionData: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'TIMER_CREATE_SESSION',
      apiCall: () => apiServices.timer.createSession(sessionData),
      onSuccess: (session) => {
        store.dispatch({
          type: 'timer/SET_CURRENT_SESSION',
          payload: session,
        });
        store.dispatch({
          type: 'timer/ADD_SESSION',
          payload: session,
        });
      },
    });

    return response.success;
  }

  static async updateSession(id: string, updates: Partial<TimerSession>): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'TIMER_UPDATE_SESSION',
      apiCall: () => apiServices.timer.updateSession(id, updates),
      onSuccess: (session) => {
        store.dispatch({
          type: 'timer/UPDATE_SESSION',
          payload: session,
        });
        
        // Update current session if it's the active one
        const currentState = store.getState();
        if (currentState.timer.currentSession?.id === session.id) {
          store.dispatch({
            type: 'timer/SET_CURRENT_SESSION',
            payload: session,
          });
        }
      },
      skipLoading: true,
    });

    return response.success;
  }

  static async getStatistics(period?: string): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'TIMER_FETCH_STATS',
      apiCall: () => apiServices.timer.getStatistics(period as any),
      onSuccess: (stats) => {
        store.dispatch({
          type: 'timer/SET_STATISTICS',
          payload: stats,
        });
      },
    });

    return response.success;
  }
}

/**
 * Analytics Actions with Redux Integration
 */
export class AnalyticsActions {
  static async fetchOverview(params?: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'ANALYTICS_FETCH_OVERVIEW',
      apiCall: () => apiServices.analytics.getOverview(params),
      onSuccess: (data) => {
        store.dispatch({
          type: 'analytics/SET_OVERVIEW',
          payload: data,
        });
      },
    });

    return response.success;
  }

  static async fetchTrends(period: 'daily' | 'weekly' | 'monthly', params?: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'ANALYTICS_FETCH_TRENDS',
      apiCall: () => apiServices.analytics.getTrends(period, params),
      onSuccess: (trends) => {
        store.dispatch({
          type: 'analytics/SET_TRENDS',
          payload: { period, data: trends },
        });
      },
    });

    return response.success;
  }

  static async fetchProductivityStats(): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'ANALYTICS_FETCH_PRODUCTIVITY',
      apiCall: () => apiServices.analytics.getProductivityStats(),
      onSuccess: (productivity) => {
        store.dispatch({
          type: 'analytics/SET_PRODUCTIVITY_STATS',
          payload: productivity,
        });
      },
    });

    return response.success;
  }

  static async exportData(format: 'csv' | 'json' | 'pdf', params?: any): Promise<string | null> {
    const response = await handleAsyncAction({
      actionType: 'ANALYTICS_EXPORT_DATA',
      apiCall: () => apiServices.analytics.exportData(format, params),
    });

    return response.success ? response.data?.downloadUrl || null : null;
  }
}

/**
 * Dashboard Actions with Redux Integration
 */
export class DashboardActions {
  static async fetchSummary(): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'DASHBOARD_FETCH_SUMMARY',
      apiCall: () => apiServices.dashboard.getSummary(),
      onSuccess: (summary) => {
        // Update multiple parts of the store
        store.dispatch({
          type: 'auth/UPDATE_USER',
          payload: summary.user,
        });

        store.dispatch({
          type: 'analytics/SET_DASHBOARD_STATS',
          payload: {
            goalStats: summary.goalStats,
            todayFocusTime: summary.todayFocusTime,
            currentStreak: summary.currentStreak,
          },
        });

        store.dispatch({
          type: 'ui/SET_DASHBOARD_DATA',
          payload: {
            recentActivity: summary.recentActivity,
            upcomingDeadlines: summary.upcomingDeadlines,
          },
        });
      },
    });

    return response.success;
  }

  static async fetchRecentActivity(limit?: number): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'DASHBOARD_FETCH_ACTIVITY',
      apiCall: () => apiServices.dashboard.getRecentActivity(limit),
      onSuccess: (activity) => {
        store.dispatch({
          type: 'ui/SET_RECENT_ACTIVITY',
          payload: activity,
        });
      },
      skipLoading: true,
    });

    return response.success;
  }
}

/**
 * Settings Actions with Redux Integration
 */
export class SettingsActions {
  static async fetchSettings(): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'SETTINGS_FETCH',
      apiCall: () => apiServices.settings.get(),
      onSuccess: (settings) => {
        store.dispatch({
          type: 'settings/SET_ALL_SETTINGS',
          payload: settings,
        });
      },
    });

    return response.success;
  }

  static async updateSettings(updates: any): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'SETTINGS_UPDATE',
      apiCall: () => apiServices.settings.update(updates),
      onSuccess: (settings) => {
        store.dispatch({
          type: 'settings/SET_ALL_SETTINGS',
          payload: settings,
        });
      },
    });

    return response.success;
  }

  static async resetSettings(): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'SETTINGS_RESET',
      apiCall: () => apiServices.settings.reset(),
      onSuccess: () => {
        store.dispatch({
          type: 'settings/RESET_TO_DEFAULTS',
        });
      },
    });

    return response.success;
  }

  static async exportSettings(): Promise<string | null> {
    const response = await handleAsyncAction({
      actionType: 'SETTINGS_EXPORT',
      apiCall: () => apiServices.settings.export(),
    });

    return response.success ? response.data?.downloadUrl || null : null;
  }

  static async importSettings(file: File): Promise<boolean> {
    const response = await handleAsyncAction({
      actionType: 'SETTINGS_IMPORT',
      apiCall: () => apiServices.settings.import(file),
      onSuccess: () => {
        // Refetch settings after import
        this.fetchSettings();
      },
    });

    return response.success;
  }
}

/**
 * Combined Redux Actions
 * Central export for all Redux-integrated actions
 */
export const reduxActions = {
  auth: AuthActions,
  goals: GoalsActions,
  timer: TimerActions,
  analytics: AnalyticsActions,
  dashboard: DashboardActions,
  settings: SettingsActions,

  // Cross-cutting actions
  async initializeApp(): Promise<void> {
    console.log('🚀 Initializing application...');

    // Check authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      apiServices.setAuthToken(token);
      
      // Try to get user profile
      const profileSuccess = await AuthActions.getProfile();
      
      if (profileSuccess) {
        console.log('✅ User authenticated, loading dashboard...');
        
        // Load initial data in parallel
        await Promise.all([
          DashboardActions.fetchSummary(),
          GoalsActions.fetchGoals({ limit: 10 }),
          TimerActions.getStatistics('week'),
          AnalyticsActions.fetchOverview(),
          SettingsActions.fetchSettings(),
        ]);
        
        console.log('✅ Application initialized successfully');
      } else {
        console.log('❌ Authentication failed, clearing token');
        localStorage.removeItem('authToken');
        apiServices.setAuthToken(null);
      }
    } else {
      console.log('ℹ️ No auth token found, user needs to login');
    }
  },

  async refreshData(): Promise<void> {
    console.log('🔄 Refreshing application data...');

    const currentState = store.getState();
    if (!currentState.auth.isAuthenticated) {
      console.log('❌ Cannot refresh data: user not authenticated');
      return;
    }

    // Refresh all data in parallel
    await Promise.all([
      DashboardActions.fetchSummary(),
      GoalsActions.fetchGoals(),
      TimerActions.fetchSessions({ limit: 20 }),
      TimerActions.getStatistics('week'),
      AnalyticsActions.fetchOverview(),
    ]);

    console.log('✅ Application data refreshed');
  },

  // Utility methods
  isLoading: (actionType: string): boolean => {
    const state = store.getState();
    return Boolean((state.ui.loading as any)[actionType]);
  },

  getError: (actionType: string): string | null => {
    const state = store.getState();
    return (state.ui.errors as any)[actionType] || null;
  },

  clearError: (actionType: string): void => {
    store.dispatch({
      type: 'ui/CLEAR_ERROR',
      payload: actionType,
    });
  },
};

// Auto-initialize when imported
window.addEventListener('load', () => {
  reduxActions.initializeApp();
});

export default reduxActions;
