/**
 * State Selectors
 * 
 * Provides type-safe selectors for accessing and computing derived state.
 * These functions help access specific parts of the state and compute derived values.
 */

import type { StoreState, Goal, TimerSession, User } from './store';

// Auth Selectors
export const authSelectors = {
  // Basic auth state
  isAuthenticated: (state: StoreState): boolean => state.auth.isAuthenticated,
  currentUser: (state: StoreState): User | null => state.auth.user,
  authToken: (state: StoreState): string | null => state.auth.token,
  isLoading: (state: StoreState): boolean => state.auth.isLoading,
  authError: (state: StoreState): string | null => state.auth.error,
  
  // Computed auth selectors
  userDisplayName: (state: StoreState): string => {
    const user = state.auth.user;
    return user ? user.name || user.email : 'Guest';
  },
  
  userAvatar: (state: StoreState): string => {
    const user = state.auth.user;
    return user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;
  },
  
  isAdmin: (state: StoreState): boolean => {
    return state.auth.user?.role === 'admin';
  },
  
  canPerformAction: (state: StoreState, requiredRole: string = 'user'): boolean => {
    const user = state.auth.user;
    if (!user) return false;
    
    const roleHierarchy = { user: 0, admin: 1 };
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
    
    return userLevel >= requiredLevel;
  },
};

// Goals Selectors
export const goalsSelectors = {
  // Basic goals state
  allGoals: (state: StoreState): Goal[] => state.goals.goals,
  activeGoal: (state: StoreState): Goal | null => state.goals.activeGoal,
  goalsLoading: (state: StoreState): boolean => state.goals.isLoading,
  goalsError: (state: StoreState): string | null => state.goals.error,
  
  // Filtered and sorted goals
  filteredGoals: (state: StoreState): Goal[] => {
    const { goals, filters, sortBy, sortOrder } = state.goals;
    
    let filtered = goals.filter(goal => {
      if (filters.category && goal.category !== filters.category) return false;
      if (filters.status && goal.status !== filters.status) return false;
      if (filters.priority && goal.priority !== filters.priority) return false;
      return true;
    });
    
    // Sort goals
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updated':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'deadline':
          comparison = new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
          break;
        default:
          comparison = a.title.localeCompare(b.title);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  },
  
  // Goal statistics
  goalStats: (state: StoreState) => {
    const goals = state.goals.goals;
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const active = goals.filter(g => g.status === 'active').length;
    const paused = goals.filter(g => g.status === 'paused').length;
    const overdue = goals.filter(g => 
      g.status !== 'completed' && new Date(g.targetDate) < new Date()
    ).length;
    
    return {
      total,
      completed,
      active,
      paused,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
  
  // Goals by category
  goalsByCategory: (state: StoreState) => {
    const goals = state.goals.goals;
    const categories = ['personal', 'professional', 'health', 'learning', 'financial'];
    
    return categories.map(category => ({
      category,
      count: goals.filter(g => g.category === category).length,
      completed: goals.filter(g => g.category === category && g.status === 'completed').length,
    }));
  },
  
  // Upcoming deadlines
  upcomingDeadlines: (state: StoreState, days: number = 7): Goal[] => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return state.goals.goals
      .filter(goal => 
        goal.status !== 'completed' && 
        new Date(goal.targetDate) >= now && 
        new Date(goal.targetDate) <= futureDate
      )
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  },
  
  // Goal by ID
  goalById: (state: StoreState, goalId: string): Goal | undefined => {
    return state.goals.goals.find(goal => goal.id === goalId);
  },
  
  // High priority goals
  highPriorityGoals: (state: StoreState): Goal[] => {
    return state.goals.goals.filter(goal => 
      (goal.priority === 'high' || goal.priority === 'urgent') && 
      goal.status === 'active'
    );
  },
};

// Timer Selectors
export const timerSelectors = {
  // Basic timer state
  currentSession: (state: StoreState): TimerSession | null => state.timer.currentSession,
  timerSessions: (state: StoreState): TimerSession[] => state.timer.sessions,
  timerSettings: (state: StoreState) => state.timer.settings,
  timerStats: (state: StoreState) => state.timer.statistics,
  
  // Current session info
  isTimerRunning: (state: StoreState): boolean => {
    const session = state.timer.currentSession;
    return session?.status === 'running';
  },
  
  isTimerPaused: (state: StoreState): boolean => {
    const session = state.timer.currentSession;
    return session?.status === 'paused';
  },
  
  currentSessionProgress: (state: StoreState): number => {
    const session = state.timer.currentSession;
    if (!session) return 0;
    
    const elapsed = session.duration - session.remainingTime;
    return (elapsed / session.duration) * 100;
  },
  
  // Session statistics
  todaysSessions: (state: StoreState): TimerSession[] => {
    const today = new Date().toDateString();
    return state.timer.sessions.filter(session => 
      new Date(session.startTime).toDateString() === today
    );
  },
  
  totalFocusTimeToday: (state: StoreState): number => {
    const todaySessions = timerSelectors.todaysSessions(state);
    return todaySessions
      .filter(session => session.type === 'pomodoro' && session.status === 'completed')
      .reduce((total, session) => total + session.duration, 0);
  },
  
  sessionsByGoal: (state: StoreState, goalId: string): TimerSession[] => {
    return state.timer.sessions.filter(session => session.goalId === goalId);
  },
  
  // Time formatting helpers
  formatTime: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const pad = (num: number) => num.toString().length === 1 ? `0${num}` : num.toString();
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  },
  
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },
};

// UI Selectors
export const uiSelectors = {
  // Basic UI state
  currentTheme: (state: StoreState) => state.ui.theme,
  isSidebarCollapsed: (state: StoreState): boolean => state.ui.sidebarCollapsed,
  notifications: (state: StoreState) => state.ui.notifications,
  modals: (state: StoreState) => state.ui.modals,
  loading: (state: StoreState) => state.ui.loading,
  errors: (state: StoreState) => state.ui.errors,
  
  // Modal state
  isModalOpen: (state: StoreState, modalName: string): boolean => {
    return state.ui.modals[modalName as keyof typeof state.ui.modals] || false;
  },
  
  // Loading state
  isLoading: (state: StoreState, section?: string): boolean => {
    if (!section) return state.ui.loading.global;
    return state.ui.loading[section as keyof typeof state.ui.loading] || false;
  },
  
  // Error state
  hasError: (state: StoreState, errorType?: string): boolean => {
    if (!errorType) return !!state.ui.errors.global;
    return !!state.ui.errors[errorType as keyof typeof state.ui.errors];
  },
  
  // Active notifications
  activeNotifications: (state: StoreState) => {
    return state.ui.notifications.filter(notification => {
      if (!notification.duration) return true;
      
      const now = new Date().getTime();
      const created = new Date(notification.createdAt).getTime();
      return (now - created) < notification.duration;
    });
  },
  
  // Theme helpers
  isDarkMode: (state: StoreState): boolean => {
    const theme = state.ui.theme;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    
    // System theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
};

// Settings Selectors
export const settingsSelectors = {
  // Basic settings
  generalSettings: (state: StoreState) => state.settings.general,
  notificationSettings: (state: StoreState) => state.settings.notifications,
  privacySettings: (state: StoreState) => state.settings.privacy,
  productivitySettings: (state: StoreState) => state.settings.productivity,
  
  // Specific settings
  language: (state: StoreState): string => state.settings.general.language,
  timezone: (state: StoreState): string => state.settings.general.timezone,
  dateFormat: (state: StoreState): string => state.settings.general.dateFormat,
  timeFormat: (state: StoreState): '12h' | '24h' => state.settings.general.timeFormat,
  
  // Notification preferences
  areNotificationsEnabled: (state: StoreState, type?: string): boolean => {
    const settings = state.settings.notifications;
    if (!type) return settings.desktop || settings.push || settings.email;
    
    return settings[type as keyof typeof settings] || false;
  },
  
  // Privacy settings
  isDataSharingEnabled: (state: StoreState): boolean => {
    return state.settings.privacy.shareAnalytics;
  },
  
  // Productivity settings
  defaultCategory: (state: StoreState): string => {
    return state.settings.productivity.defaultGoalCategory;
  },
};

// Analytics Selectors
export const analyticsSelectors = {
  // Basic analytics state
  analyticsData: (state: StoreState) => state.analytics.data,
  analyticsLoading: (state: StoreState): boolean => state.analytics.isLoading,
  analyticsError: (state: StoreState): string | null => state.analytics.error,
  dateRange: (state: StoreState) => state.analytics.dateRange,
  
  // Computed analytics
  overviewStats: (state: StoreState) => {
    return state.analytics.data?.overview || null;
  },
  
  productivityTrends: (state: StoreState) => {
    return state.analytics.data?.trends || null;
  },
  
  categoryBreakdown: (state: StoreState) => {
    return state.analytics.data?.categories || [];
  },
  
  productivityInsights: (state: StoreState) => {
    return state.analytics.data?.productivity || null;
  },
  
  // Time-based data
  dailyProgress: (state: StoreState) => {
    const trends = state.analytics.data?.trends?.daily || [];
    return trends.slice(-7); // Last 7 days
  },
  
  weeklyProgress: (state: StoreState) => {
    const trends = state.analytics.data?.trends?.weekly || [];
    return trends.slice(-4); // Last 4 weeks
  },
  
  monthlyProgress: (state: StoreState) => {
    const trends = state.analytics.data?.trends?.monthly || [];
    return trends.slice(-6); // Last 6 months
  },
};

// Combined Selectors (cross-slice)
export const combinedSelectors = {
  // Dashboard overview
  dashboardOverview: (state: StoreState) => ({
    user: authSelectors.currentUser(state),
    goalStats: goalsSelectors.goalStats(state),
    todayFocusTime: timerSelectors.totalFocusTimeToday(state),
    upcomingDeadlines: goalsSelectors.upcomingDeadlines(state, 3),
    isTimerRunning: timerSelectors.isTimerRunning(state),
    currentSession: timerSelectors.currentSession(state),
  }),
  
  // Goal with timer data
  goalWithTimerData: (state: StoreState, goalId: string) => {
    const goal = goalsSelectors.goalById(state, goalId);
    const sessions = timerSelectors.sessionsByGoal(state, goalId);
    const totalTime = sessions.reduce((total, session) => total + session.duration, 0);
    
    return goal ? {
      ...goal,
      sessions,
      totalTimeSpent: totalTime,
      sessionCount: sessions.length,
    } : null;
  },
  
  // Current user preferences
  userPreferences: (state: StoreState) => ({
    theme: uiSelectors.currentTheme(state),
    language: settingsSelectors.language(state),
    timezone: settingsSelectors.timezone(state),
    notifications: settingsSelectors.notificationSettings(state),
    sidebarCollapsed: uiSelectors.isSidebarCollapsed(state),
  }),
  
  // App state summary
  appStatus: (state: StoreState) => ({
    isAuthenticated: authSelectors.isAuthenticated(state),
    hasActiveTimer: timerSelectors.isTimerRunning(state),
    hasErrors: uiSelectors.hasError(state),
    isLoading: uiSelectors.isLoading(state),
    notificationCount: uiSelectors.activeNotifications(state).length,
    totalGoals: goalsSelectors.goalStats(state).total,
  }),
};

// Helper function to create memoized selectors
export const createSelector = <T>(
  selector: (state: StoreState) => T,
  deps: Array<(state: StoreState) => any> = []
) => {
  let lastDeps: any[] = [];
  let lastResult: T;
  
  return (state: StoreState): T => {
    const currentDeps = deps.map(dep => dep(state));
    const depsChanged = currentDeps.some((dep, index) => dep !== lastDeps[index]);
    
    if (depsChanged || lastDeps.length === 0) {
      lastResult = selector(state);
      lastDeps = currentDeps;
    }
    
    return lastResult;
  };
};

// Export all selectors
export const selectors = {
  auth: authSelectors,
  goals: goalsSelectors,
  timer: timerSelectors,
  ui: uiSelectors,
  settings: settingsSelectors,
  analytics: analyticsSelectors,
  combined: combinedSelectors,
  createSelector,
};

export default selectors;
