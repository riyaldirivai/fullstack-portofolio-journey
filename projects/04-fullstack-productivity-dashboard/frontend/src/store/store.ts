/**
 * Custom State Management System
 * 
 * A lightweight, Redux-inspired state management solution without external dependencies.
 * Provides predictable state updates, action dispatch, and subscription system.
 */

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export interface StateSlice<T = any> {
  name: string;
  initialState: T;
  reducers: Record<string, (state: T, action: Action) => T>;
  actions: Record<string, (...args: any[]) => Action>;
}

export interface StoreState {
  auth: AuthState;
  goals: GoalsState;
  timer: TimerState;
  ui: UIState;
  settings: SettingsState;
  analytics: AnalyticsState;
}

// Auth State Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  lastLogin: string | null;
}

// Goals State Types
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'health' | 'learning' | 'financial';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  subGoals: SubGoal[];
  tags: string[];
}

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface GoalsState {
  goals: Goal[];
  activeGoal: Goal | null;
  filters: {
    category: string | null;
    status: string | null;
    priority: string | null;
  };
  sortBy: 'created' | 'updated' | 'priority' | 'progress' | 'deadline';
  sortOrder: 'asc' | 'desc';
  isLoading: boolean;
  error: string | null;
}

// Timer State Types
export interface TimerSession {
  id: string;
  goalId?: string;
  type: 'pomodoro' | 'break' | 'custom';
  duration: number; // in seconds
  remainingTime: number;
  startTime: string;
  endTime?: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  notes?: string;
}

export interface TimerState {
  currentSession: TimerSession | null;
  sessions: TimerSession[];
  settings: {
    workDuration: number; // 25 minutes default
    shortBreakDuration: number; // 5 minutes default
    longBreakDuration: number; // 15 minutes default
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    sessionsUntilLongBreak: number; // 4 default
  };
  statistics: {
    totalSessions: number;
    totalFocusTime: number;
    streakDays: number;
    currentStreak: number;
  };
  isLoading: boolean;
  error: string | null;
}

// UI State Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
  createdAt: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  modals: {
    goalForm: boolean;
    timerSettings: boolean;
    confirmDelete: boolean;
  };
  loading: {
    global: boolean;
    goals: boolean;
    timer: boolean;
    auth: boolean;
  };
  errors: {
    global: string | null;
    network: string | null;
    validation: Record<string, string>;
  };
}

// Settings State Types
export interface SettingsState {
  general: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    goalReminders: boolean;
    timerAlerts: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
    dataRetention: number; // days
  };
  productivity: {
    defaultGoalCategory: string;
    autoArchiveCompleted: boolean;
    showProgressInTitle: boolean;
  };
}

// Analytics State Types
export interface AnalyticsData {
  overview: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completionRate: number;
    totalFocusTime: number;
    averageSessionTime: number;
  };
  trends: {
    daily: Array<{ date: string; goals: number; time: number }>;
    weekly: Array<{ week: string; goals: number; time: number }>;
    monthly: Array<{ month: string; goals: number; time: number }>;
  };
  categories: Array<{
    category: string;
    count: number;
    completionRate: number;
    totalTime: number;
  }>;
  productivity: {
    mostProductiveDay: string;
    mostProductiveHour: number;
    streakStats: {
      current: number;
      longest: number;
      thisMonth: number;
    };
  };
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  dateRange: {
    from: string;
    to: string;
  };
  filters: {
    category: string | null;
    goal: string | null;
  };
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Store Class
 * 
 * Central state management with subscription system and action dispatch.
 */
export class Store {
  private state: StoreState;
  private subscribers: Array<(state: StoreState) => void> = [];
  private middlewares: Array<(action: Action, state: StoreState) => void> = [];

  constructor(initialState: Partial<StoreState> = {}) {
    this.state = {
      auth: {
        user: null,
        token: localStorage.getItem('authToken'),
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        lastLogin: null,
      },
      goals: {
        goals: [],
        activeGoal: null,
        filters: {
          category: null,
          status: null,
          priority: null,
        },
        sortBy: 'created',
        sortOrder: 'desc',
        isLoading: false,
        error: null,
      },
      timer: {
        currentSession: null,
        sessions: [],
        settings: {
          workDuration: 25 * 60, // 25 minutes
          shortBreakDuration: 5 * 60, // 5 minutes
          longBreakDuration: 15 * 60, // 15 minutes
          autoStartBreaks: false,
          autoStartPomodoros: false,
          sessionsUntilLongBreak: 4,
        },
        statistics: {
          totalSessions: 0,
          totalFocusTime: 0,
          streakDays: 0,
          currentStreak: 0,
        },
        isLoading: false,
        error: null,
      },
      ui: {
        theme: 'system',
        sidebarCollapsed: false,
        notifications: [],
        modals: {
          goalForm: false,
          timerSettings: false,
          confirmDelete: false,
        },
        loading: {
          global: false,
          goals: false,
          timer: false,
          auth: false,
        },
        errors: {
          global: null,
          network: null,
          validation: {},
        },
      },
      settings: {
        general: {
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dateFormat: 'MM/dd/yyyy',
          timeFormat: '12h',
        },
        notifications: {
          email: true,
          push: true,
          desktop: true,
          goalReminders: true,
          timerAlerts: true,
        },
        privacy: {
          shareAnalytics: false,
          publicProfile: false,
          dataRetention: 365,
        },
        productivity: {
          defaultGoalCategory: 'personal',
          autoArchiveCompleted: true,
          showProgressInTitle: false,
        },
      },
      analytics: {
        data: null,
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
        filters: {
          category: null,
          goal: null,
        },
        isLoading: false,
        error: null,
        lastUpdated: null,
      },
      ...initialState,
    };

    // Load persisted state
    this.loadPersistedState();
  }

  /**
   * Get current state
   */
  getState(): StoreState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: StoreState) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Add middleware
   */
  use(middleware: (action: Action, state: StoreState) => void) {
    this.middlewares.push(middleware);
  }

  /**
   * Dispatch action
   */
  dispatch(action: Action): void {
    // Run middlewares
    this.middlewares.forEach(middleware => {
      middleware(action, this.state);
    });

    // Apply action to state
    const newState = this.applyAction(action, this.state);
    
    if (newState !== this.state) {
      this.state = newState;
      this.persistState();
      this.notifySubscribers();
    }
  }

  /**
   * Select specific state slice
   */
  select<T>(selector: (state: StoreState) => T): T {
    return selector(this.state);
  }

  private applyAction(action: Action, state: StoreState): StoreState {
    const [sliceName, actionName] = action.type.split('/');
    
    switch (sliceName) {
      case 'auth':
        return { ...state, auth: this.authReducer(state.auth, action) };
      case 'goals':
        return { ...state, goals: this.goalsReducer(state.goals, action) };
      case 'timer':
        return { ...state, timer: this.timerReducer(state.timer, action) };
      case 'ui':
        return { ...state, ui: this.uiReducer(state.ui, action) };
      case 'settings':
        return { ...state, settings: this.settingsReducer(state.settings, action) };
      case 'analytics':
        return { ...state, analytics: this.analyticsReducer(state.analytics, action) };
      default:
        return state;
    }
  }

  private authReducer(state: AuthState, action: Action): AuthState {
    switch (action.type) {
      case 'auth/loginStart':
        return { ...state, isLoading: true, error: null };
      case 'auth/loginSuccess':
        return {
          ...state,
          isLoading: false,
          isAuthenticated: true,
          user: action.payload.user,
          token: action.payload.token,
          lastLogin: new Date().toISOString(),
          loginAttempts: 0,
        };
      case 'auth/loginFailure':
        return {
          ...state,
          isLoading: false,
          error: action.payload,
          loginAttempts: state.loginAttempts + 1,
        };
      case 'auth/logout':
        return {
          ...state,
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        };
      case 'auth/clearError':
        return { ...state, error: null };
      default:
        return state;
    }
  }

  private goalsReducer(state: GoalsState, action: Action): GoalsState {
    switch (action.type) {
      case 'goals/loadStart':
        return { ...state, isLoading: true, error: null };
      case 'goals/loadSuccess':
        return { ...state, isLoading: false, goals: action.payload };
      case 'goals/loadFailure':
        return { ...state, isLoading: false, error: action.payload };
      case 'goals/add':
        return { ...state, goals: [...state.goals, action.payload] };
      case 'goals/update':
        return {
          ...state,
          goals: state.goals.map(goal =>
            goal.id === action.payload.id ? { ...goal, ...action.payload } : goal
          ),
        };
      case 'goals/delete':
        return {
          ...state,
          goals: state.goals.filter(goal => goal.id !== action.payload),
        };
      case 'goals/setActive':
        return { ...state, activeGoal: action.payload };
      case 'goals/setFilters':
        return { ...state, filters: { ...state.filters, ...action.payload } };
      case 'goals/setSort':
        return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
      default:
        return state;
    }
  }

  private timerReducer(state: TimerState, action: Action): TimerState {
    switch (action.type) {
      case 'timer/start':
        return { ...state, currentSession: action.payload };
      case 'timer/pause':
        return {
          ...state,
          currentSession: state.currentSession
            ? { ...state.currentSession, status: 'paused' }
            : null,
        };
      case 'timer/resume':
        return {
          ...state,
          currentSession: state.currentSession
            ? { ...state.currentSession, status: 'running' }
            : null,
        };
      case 'timer/stop':
        return { ...state, currentSession: null };
      case 'timer/complete':
        return {
          ...state,
          currentSession: null,
          sessions: [...state.sessions, action.payload],
          statistics: {
            ...state.statistics,
            totalSessions: state.statistics.totalSessions + 1,
            totalFocusTime: state.statistics.totalFocusTime + action.payload.duration,
          },
        };
      case 'timer/updateSettings':
        return { ...state, settings: { ...state.settings, ...action.payload } };
      case 'timer/tick':
        return {
          ...state,
          currentSession: state.currentSession
            ? { ...state.currentSession, remainingTime: action.payload }
            : null,
        };
      default:
        return state;
    }
  }

  private uiReducer(state: UIState, action: Action): UIState {
    switch (action.type) {
      case 'ui/setTheme':
        return { ...state, theme: action.payload };
      case 'ui/toggleSidebar':
        return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
      case 'ui/addNotification':
        return { ...state, notifications: [...state.notifications, action.payload] };
      case 'ui/removeNotification':
        return {
          ...state,
          notifications: state.notifications.filter(n => n.id !== action.payload),
        };
      case 'ui/openModal':
        return { ...state, modals: { ...state.modals, [action.payload]: true } };
      case 'ui/closeModal':
        return { ...state, modals: { ...state.modals, [action.payload]: false } };
      case 'ui/setLoading':
        return { ...state, loading: { ...state.loading, ...action.payload } };
      case 'ui/setError':
        return { ...state, errors: { ...state.errors, ...action.payload } };
      default:
        return state;
    }
  }

  private settingsReducer(state: SettingsState, action: Action): SettingsState {
    switch (action.type) {
      case 'settings/updateGeneral':
        return { ...state, general: { ...state.general, ...action.payload } };
      case 'settings/updateNotifications':
        return { ...state, notifications: { ...state.notifications, ...action.payload } };
      case 'settings/updatePrivacy':
        return { ...state, privacy: { ...state.privacy, ...action.payload } };
      case 'settings/updateProductivity':
        return { ...state, productivity: { ...state.productivity, ...action.payload } };
      default:
        return state;
    }
  }

  private analyticsReducer(state: AnalyticsState, action: Action): AnalyticsState {
    switch (action.type) {
      case 'analytics/loadStart':
        return { ...state, isLoading: true, error: null };
      case 'analytics/loadSuccess':
        return {
          ...state,
          isLoading: false,
          data: action.payload,
          lastUpdated: new Date().toISOString(),
        };
      case 'analytics/loadFailure':
        return { ...state, isLoading: false, error: action.payload };
      case 'analytics/setDateRange':
        return { ...state, dateRange: action.payload };
      case 'analytics/setFilters':
        return { ...state, filters: { ...state.filters, ...action.payload } };
      default:
        return state;
    }
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  private persistState(): void {
    try {
      const persistedState = {
        auth: {
          token: this.state.auth.token,
          user: this.state.auth.user,
        },
        settings: this.state.settings,
        ui: {
          theme: this.state.ui.theme,
          sidebarCollapsed: this.state.ui.sidebarCollapsed,
        },
      };
      localStorage.setItem('appState', JSON.stringify(persistedState));
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  private loadPersistedState(): void {
    try {
      const persistedData = localStorage.getItem('appState');
      if (persistedData) {
        const parsed = JSON.parse(persistedData);
        this.state = {
          ...this.state,
          auth: { ...this.state.auth, ...parsed.auth },
          settings: { ...this.state.settings, ...parsed.settings },
          ui: { ...this.state.ui, ...parsed.ui },
        };
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }
}

// Create store instance
export const store = new Store();

// Export default
export default store;
