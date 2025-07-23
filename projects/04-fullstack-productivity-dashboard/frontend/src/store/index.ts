/**
 * Store Index
 * 
 * Main export file for the custom Redux-inspired state management system.
 * Provides store instance, actions, selectors, and middleware.
 */

// Import core store
import { Store } from './store';
import type { StoreState } from './store';

// Import actions
import { actions } from './actions';

// Import selectors
import { selectors } from './selectors';

// Import middleware
import { apiMiddleware, apiService } from './middleware/apiMiddleware';
import { errorMiddleware, errorManager, withErrorBoundary, handleAsync } from './middleware/errorMiddleware';
import { loggingMiddleware, logger } from './middleware/loggingMiddleware';

// Create store instance with middleware
const store = new Store();

// Add middleware
store.use(apiMiddleware);
store.use(errorMiddleware);
store.use(loggingMiddleware);

// Store manager for class-based components
export class StoreManager {
  private static instance: StoreManager;
  private subscribers: Array<(state: StoreState) => void> = [];

  static getInstance(): StoreManager {
    if (!StoreManager.instance) {
      StoreManager.instance = new StoreManager();
      this.setupSubscriptions();
    }
    return StoreManager.instance;
  }

  private static setupSubscriptions() {
    store.subscribe((state: StoreState) => {
      StoreManager.instance.subscribers.forEach(callback => callback(state));
    });
  }

  // Subscribe to state changes
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

  // Get current state
  getState(): StoreState {
    return store.getState();
  }

  // Dispatch action
  dispatch(action: any) {
    return store.dispatch(action);
  }

  // Select specific state slice
  select<T>(selector: (state: StoreState) => T): T {
    return selector(store.getState());
  }

  // Convenience methods for common operations
  login(email: string, password: string) {
    return actions.async.login(email, password)(this.dispatch.bind(this));
  }

  logout() {
    this.dispatch(actions.auth.logout());
  }

  loadGoals() {
    return actions.async.loadGoals()(this.dispatch.bind(this));
  }

  createGoal(goalData: any) {
    return actions.async.createGoal(goalData)(this.dispatch.bind(this));
  }

  loadAnalytics(dateRange?: { from: string; to: string }) {
    return actions.async.loadAnalytics(dateRange)(this.dispatch.bind(this));
  }

  // Timer methods
  startTimer(type: 'pomodoro' | 'break' | 'custom', duration: number, goalId?: string) {
    this.dispatch(actions.timer.createSession(type, duration, goalId));
  }

  pauseTimer() {
    this.dispatch(actions.timer.pause());
  }

  resumeTimer() {
    this.dispatch(actions.timer.resume());
  }

  stopTimer() {
    this.dispatch(actions.timer.stop());
  }

  // UI methods
  showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    switch (type) {
      case 'success':
        this.dispatch(actions.ui.showSuccess(message));
        break;
      case 'error':
        this.dispatch(actions.ui.showError(message));
        break;
      case 'warning':
        this.dispatch(actions.ui.showWarning(message));
        break;
      case 'info':
        this.dispatch(actions.ui.showInfo(message));
        break;
    }
  }

  toggleTheme() {
    const currentTheme = this.select(selectors.ui.currentTheme);
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.dispatch(actions.ui.setTheme(newTheme));
  }

  toggleSidebar() {
    this.dispatch(actions.ui.toggleSidebar());
  }

  openModal(modalName: string) {
    this.dispatch(actions.ui.openModal(modalName));
  }

  closeModal(modalName: string) {
    this.dispatch(actions.ui.closeModal(modalName));
  }

  // Settings methods
  updateSettings(section: 'general' | 'notifications' | 'privacy' | 'productivity', settings: any) {
    switch (section) {
      case 'general':
        this.dispatch(actions.settings.updateGeneral(settings));
        break;
      case 'notifications':
        this.dispatch(actions.settings.updateNotifications(settings));
        break;
      case 'privacy':
        this.dispatch(actions.settings.updatePrivacy(settings));
        break;
      case 'productivity':
        this.dispatch(actions.settings.updateProductivity(settings));
        break;
    }
  }
}

// Create store manager instance
export const storeManager = StoreManager.getInstance();

// Hooks for functional components (if used in future)
export const useStore = () => storeManager;

export const useSelector = <T>(selector: (state: StoreState) => T): T => {
  return storeManager.select(selector);
};

export const useDispatch = () => storeManager.dispatch.bind(storeManager);

// Store development tools
export const devTools = {
  // Get store state
  getState: () => store.getState(),
  
  // Get action logs
  getLogs: (options?: any) => logger.getLogs(options),
  
  // Get error reports
  getErrors: () => errorManager.getErrorHistory(),
  
  // Get performance stats
  getStats: () => ({
    logs: logger.getStats(),
    errors: errorManager.getErrorStats(),
  }),
  
  // Clear logs and errors
  clear: () => {
    logger.clearLogs();
    errorManager.clearErrorHistory();
  },
  
  // Export data
  export: (format: 'json' | 'csv' = 'json') => ({
    state: store.getState(),
    logs: logger.exportLogs(format),
    errors: errorManager.getErrorHistory(),
  }),
  
  // Time travel debugging (basic implementation)
  timeTravel: {
    getHistory: () => logger.getLogs({ level: 'debug' }),
    replayActions: (actions: any[]) => {
      actions.forEach(action => store.dispatch(action));
    },
  },
};

// Make dev tools available globally in development
const isDevelopment = window.location.hostname === 'localhost';
if (isDevelopment) {
  (window as any).__STORE_DEV_TOOLS__ = devTools;
  console.log('🛠️ Store dev tools available at window.__STORE_DEV_TOOLS__');
}

// Export everything
export {
  // Core store
  store,
  
  // Actions
  actions,
  
  // Selectors
  selectors,
  
  // Services
  apiService,
  
  // Utilities
  withErrorBoundary,
  handleAsync,
  logger,
  errorManager,
  
  // Types
  type StoreState,
};

// Default export
export default storeManager;
