/**
 * Action Creators
 * 
 * Provides type-safe action creators for all store slices.
 * These functions create standardized action objects for dispatch.
 */

import type { Action, User, Goal, TimerSession, Notification, AnalyticsData } from './store';

// Auth Action Creators
export const authActions = {
  loginStart: (): Action => ({
    type: 'auth/loginStart',
  }),

  loginSuccess: (user: User, token: string): Action => ({
    type: 'auth/loginSuccess',
    payload: { user, token },
  }),

  loginFailure: (error: string): Action => ({
    type: 'auth/loginFailure',
    payload: error,
  }),

  logout: (): Action => ({
    type: 'auth/logout',
  }),

  clearError: (): Action => ({
    type: 'auth/clearError',
  }),

  updateProfile: (updates: Partial<User>): Action => ({
    type: 'auth/updateProfile',
    payload: updates,
  }),
};

// Goals Action Creators
export const goalsActions = {
  loadStart: (): Action => ({
    type: 'goals/loadStart',
  }),

  loadSuccess: (goals: Goal[]): Action => ({
    type: 'goals/loadSuccess',
    payload: goals,
  }),

  loadFailure: (error: string): Action => ({
    type: 'goals/loadFailure',
    payload: error,
  }),

  add: (goal: Goal): Action => ({
    type: 'goals/add',
    payload: goal,
  }),

  update: (goalId: string, updates: Partial<Goal>): Action => ({
    type: 'goals/update',
    payload: { id: goalId, ...updates },
  }),

  delete: (goalId: string): Action => ({
    type: 'goals/delete',
    payload: goalId,
  }),

  setActive: (goal: Goal | null): Action => ({
    type: 'goals/setActive',
    payload: goal,
  }),

  setFilters: (filters: Partial<{
    category: string | null;
    status: string | null;
    priority: string | null;
  }>): Action => ({
    type: 'goals/setFilters',
    payload: filters,
  }),

  setSort: (sortBy: string, sortOrder: 'asc' | 'desc'): Action => ({
    type: 'goals/setSort',
    payload: { sortBy, sortOrder },
  }),

  updateProgress: (goalId: string, progress: number): Action => ({
    type: 'goals/update',
    payload: { id: goalId, progress, updatedAt: new Date().toISOString() },
  }),

  toggleSubGoal: (goalId: string, subGoalId: string, completed: boolean): Action => ({
    type: 'goals/toggleSubGoal',
    payload: { goalId, subGoalId, completed },
  }),

  addSubGoal: (goalId: string, subGoal: { title: string }): Action => ({
    type: 'goals/addSubGoal',
    payload: { 
      goalId, 
      subGoal: {
        id: `subgoal_${Date.now()}`,
        title: subGoal.title,
        completed: false,
      }
    },
  }),
};

// Timer Action Creators
export const timerActions = {
  start: (session: TimerSession): Action => ({
    type: 'timer/start',
    payload: session,
  }),

  pause: (): Action => ({
    type: 'timer/pause',
  }),

  resume: (): Action => ({
    type: 'timer/resume',
  }),

  stop: (): Action => ({
    type: 'timer/stop',
  }),

  complete: (session: TimerSession): Action => ({
    type: 'timer/complete',
    payload: session,
  }),

  tick: (remainingTime: number): Action => ({
    type: 'timer/tick',
    payload: remainingTime,
  }),

  updateSettings: (settings: Partial<{
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    sessionsUntilLongBreak: number;
  }>): Action => ({
    type: 'timer/updateSettings',
    payload: settings,
  }),

  createSession: (
    type: 'pomodoro' | 'break' | 'custom',
    duration: number,
    goalId?: string
  ): Action => ({
    type: 'timer/start',
    payload: {
      id: `session_${Date.now()}`,
      type,
      duration,
      remainingTime: duration,
      startTime: new Date().toISOString(),
      status: 'running' as const,
      goalId,
    },
  }),

  addNote: (sessionId: string, notes: string): Action => ({
    type: 'timer/addNote',
    payload: { sessionId, notes },
  }),
};

// UI Action Creators
export const uiActions = {
  setTheme: (theme: 'light' | 'dark' | 'system'): Action => ({
    type: 'ui/setTheme',
    payload: theme,
  }),

  toggleSidebar: (): Action => ({
    type: 'ui/toggleSidebar',
  }),

  setSidebarCollapsed: (collapsed: boolean): Action => ({
    type: 'ui/setSidebarCollapsed',
    payload: collapsed,
  }),

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>): Action => ({
    type: 'ui/addNotification',
    payload: {
      ...notification,
      id: `notification_${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
  }),

  removeNotification: (notificationId: string): Action => ({
    type: 'ui/removeNotification',
    payload: notificationId,
  }),

  openModal: (modalName: string): Action => ({
    type: 'ui/openModal',
    payload: modalName,
  }),

  closeModal: (modalName: string): Action => ({
    type: 'ui/closeModal',
    payload: modalName,
  }),

  setLoading: (loading: Partial<{
    global: boolean;
    goals: boolean;
    timer: boolean;
    auth: boolean;
  }>): Action => ({
    type: 'ui/setLoading',
    payload: loading,
  }),

  setError: (errors: Partial<{
    global: string | null;
    network: string | null;
    validation: Record<string, string>;
  }>): Action => ({
    type: 'ui/setError',
    payload: errors,
  }),

  clearError: (errorType: string): Action => ({
    type: 'ui/setError',
    payload: { [errorType]: null },
  }),

  showSuccess: (message: string): Action => ({
    type: 'ui/addNotification',
    payload: {
      id: `success_${Date.now()}`,
      type: 'success' as const,
      title: 'Success',
      message,
      duration: 5000,
      createdAt: new Date().toISOString(),
    },
  }),

  showError: (message: string): Action => ({
    type: 'ui/addNotification',
    payload: {
      id: `error_${Date.now()}`,
      type: 'error' as const,
      title: 'Error',
      message,
      duration: 8000,
      createdAt: new Date().toISOString(),
    },
  }),

  showWarning: (message: string): Action => ({
    type: 'ui/addNotification',
    payload: {
      id: `warning_${Date.now()}`,
      type: 'warning' as const,
      title: 'Warning',
      message,
      duration: 6000,
      createdAt: new Date().toISOString(),
    },
  }),

  showInfo: (message: string): Action => ({
    type: 'ui/addNotification',
    payload: {
      id: `info_${Date.now()}`,
      type: 'info' as const,
      title: 'Info',
      message,
      duration: 4000,
      createdAt: new Date().toISOString(),
    },
  }),
};

// Settings Action Creators
export const settingsActions = {
  updateGeneral: (settings: Partial<{
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  }>): Action => ({
    type: 'settings/updateGeneral',
    payload: settings,
  }),

  updateNotifications: (settings: Partial<{
    email: boolean;
    push: boolean;
    desktop: boolean;
    goalReminders: boolean;
    timerAlerts: boolean;
  }>): Action => ({
    type: 'settings/updateNotifications',
    payload: settings,
  }),

  updatePrivacy: (settings: Partial<{
    shareAnalytics: boolean;
    publicProfile: boolean;
    dataRetention: number;
  }>): Action => ({
    type: 'settings/updatePrivacy',
    payload: settings,
  }),

  updateProductivity: (settings: Partial<{
    defaultGoalCategory: string;
    autoArchiveCompleted: boolean;
    showProgressInTitle: boolean;
  }>): Action => ({
    type: 'settings/updateProductivity',
    payload: settings,
  }),

  resetToDefaults: (): Action => ({
    type: 'settings/resetToDefaults',
  }),

  exportSettings: (): Action => ({
    type: 'settings/export',
  }),

  importSettings: (settings: Partial<any>): Action => ({
    type: 'settings/import',
    payload: settings,
  }),
};

// Analytics Action Creators
export const analyticsActions = {
  loadStart: (): Action => ({
    type: 'analytics/loadStart',
  }),

  loadSuccess: (data: AnalyticsData): Action => ({
    type: 'analytics/loadSuccess',
    payload: data,
  }),

  loadFailure: (error: string): Action => ({
    type: 'analytics/loadFailure',
    payload: error,
  }),

  setDateRange: (from: string, to: string): Action => ({
    type: 'analytics/setDateRange',
    payload: { from, to },
  }),

  setFilters: (filters: Partial<{
    category: string | null;
    goal: string | null;
  }>): Action => ({
    type: 'analytics/setFilters',
    payload: filters,
  }),

  refreshData: (): Action => ({
    type: 'analytics/refresh',
  }),

  exportReport: (format: 'csv' | 'pdf' | 'json'): Action => ({
    type: 'analytics/export',
    payload: { format },
  }),

  setTimeRange: (range: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'): Action => {
    const now = new Date();
    let from: Date;
    
    switch (range) {
      case 'day':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      type: 'analytics/setDateRange',
      payload: {
        from: from.toISOString(),
        to: now.toISOString(),
      },
    };
  },
};

// Async Action Creators (Thunks)
export const asyncActions = {
  // Auth async actions
  login: (email: string, password: string) => async (dispatch: (action: Action) => void) => {
    dispatch(authActions.loginStart());
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      dispatch(authActions.loginSuccess(data.user, data.token));
      dispatch(uiActions.showSuccess('Welcome back!'));
    } catch (error) {
      dispatch(authActions.loginFailure(error instanceof Error ? error.message : 'Login failed'));
      dispatch(uiActions.showError('Login failed. Please check your credentials.'));
    }
  },

  // Goals async actions
  loadGoals: () => async (dispatch: (action: Action) => void) => {
    dispatch(goalsActions.loadStart());
    
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to load goals');
      
      const goals = await response.json();
      dispatch(goalsActions.loadSuccess(goals));
    } catch (error) {
      dispatch(goalsActions.loadFailure(error instanceof Error ? error.message : 'Failed to load goals'));
    }
  },

  createGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => async (dispatch: (action: Action) => void) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      });
      
      if (!response.ok) throw new Error('Failed to create goal');
      
      const newGoal = await response.json();
      dispatch(goalsActions.add(newGoal));
      dispatch(uiActions.showSuccess('Goal created successfully!'));
    } catch (error) {
      dispatch(uiActions.showError('Failed to create goal. Please try again.'));
    }
  },

  // Analytics async actions
  loadAnalytics: (dateRange?: { from: string; to: string }) => async (dispatch: (action: Action) => void) => {
    dispatch(analyticsActions.loadStart());
    
    try {
      const params = dateRange ? `?from=${dateRange.from}&to=${dateRange.to}` : '';
      const response = await fetch(`/api/analytics${params}`);
      
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      dispatch(analyticsActions.loadSuccess(data));
    } catch (error) {
      dispatch(analyticsActions.loadFailure(error instanceof Error ? error.message : 'Failed to load analytics'));
    }
  },
};

// Export all action creators
export const actions = {
  auth: authActions,
  goals: goalsActions,
  timer: timerActions,
  ui: uiActions,
  settings: settingsActions,
  analytics: analyticsActions,
  async: asyncActions,
};

export default actions;
