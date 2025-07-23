/**
 * Error Middleware
 * 
 * Handles error logging, reporting, and user notification for the store.
 * Provides centralized error management across the application.
 */

import type { Action } from '../store';

export interface ErrorReport {
  id: string;
  timestamp: string;
  action: Action;
  error: Error | string;
  context: {
    userAgent: string;
    url: string;
    userId?: string;
    stackTrace?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
}

class ErrorManager {
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private retryAttempts = 3;
  private reportingEndpoint = '/api/errors';

  constructor() {
    // Listen for unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(
        new Error(event.message),
        { action: { type: 'global/unhandledError' }, severity: 'high' }
      );
    });

    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise: ${event.reason}`),
        { action: { type: 'global/unhandledPromise' }, severity: 'high' }
      );
    });
  }

  captureError(
    error: Error | string,
    options: {
      action?: Action;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      context?: Record<string, any>;
      userId?: string;
    } = {}
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      action: options.action || { type: 'unknown' },
      error,
      context: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: options.userId,
        stackTrace: error instanceof Error ? error.stack : undefined,
        ...options.context,
      },
      severity: options.severity || 'medium',
      handled: false,
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Log to console in development
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isDevelopment) {
      console.group(`🚨 Error Report [${errorReport.severity.toUpperCase()}]`);
      console.error('Error:', error);
      console.log('Action:', errorReport.action);
      console.log('Context:', errorReport.context);
      console.groupEnd();
    }

    // Report critical errors immediately
    if (errorReport.severity === 'critical') {
      this.reportError(errorReport);
    }

    return errorId;
  }

  private async reportError(errorReport: ErrorReport): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        await fetch(this.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        });
        
        errorReport.handled = true;
        break;
      } catch (reportingError) {
        attempts++;
        console.warn(`Failed to report error (attempt ${attempts}):`, reportingError);
        
        if (attempts >= this.retryAttempts) {
          // Store in localStorage as fallback
          this.storeErrorLocally(errorReport);
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const storedErrors = this.getStoredErrors();
      storedErrors.push(errorReport);
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('errorReports', JSON.stringify(storedErrors));
    } catch (storageError) {
      console.error('Failed to store error locally:', storageError);
    }
  }

  private getStoredErrors(): ErrorReport[] {
    try {
      const stored = localStorage.getItem('errorReports');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async flushStoredErrors(): Promise<void> {
    const storedErrors = this.getStoredErrors();
    
    for (const errorReport of storedErrors) {
      if (!errorReport.handled) {
        await this.reportError(errorReport);
      }
    }
    
    // Clear stored errors after successful reporting
    const unhandledErrors = storedErrors.filter(error => !error.handled);
    if (unhandledErrors.length === 0) {
      localStorage.removeItem('errorReports');
    } else {
      localStorage.setItem('errorReports', JSON.stringify(unhandledErrors));
    }
  }

  getErrorHistory(): ErrorReport[] {
    return [...this.errorQueue];
  }

  clearErrorHistory(): void {
    this.errorQueue = [];
  }

  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    recent: number;
  } {
    const now = Date.now();
    const recentThreshold = now - (24 * 60 * 60 * 1000); // 24 hours

    const stats = {
      total: this.errorQueue.length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
      byType: {} as Record<string, number>,
      recent: 0,
    };

    this.errorQueue.forEach(error => {
      // Count by severity
      stats.bySeverity[error.severity]++;
      
      // Count by action type
      const actionType = error.action.type.split('/')[0];
      stats.byType[actionType] = (stats.byType[actionType] || 0) + 1;
      
      // Count recent errors
      if (new Date(error.timestamp).getTime() > recentThreshold) {
        stats.recent++;
      }
    });

    return stats;
  }
}

// Create error manager instance
const errorManager = new ErrorManager();

// Error middleware function
export const errorMiddleware = (action: Action, state: any) => {
  // Handle error actions
  if (action.type.endsWith('/failure') || action.type.includes('error')) {
    const severity = determineSeverity(action);
    
    errorManager.captureError(
      action.payload || 'Unknown error',
      {
        action,
        severity,
        userId: state.auth?.user?.id,
        context: {
          currentRoute: window.location.pathname,
          stateSnapshot: getRelevantState(state, action),
        },
      }
    );
  }

  // Monitor for specific critical errors
  if (isCriticalAction(action)) {
    console.warn('Critical action detected:', action.type);
  }

  // Track action performance in development
  const isDevelopment = window.location.hostname === 'localhost';
  if (isDevelopment && action.type.endsWith('/start')) {
    const startTime = performance.now();
    
    // Look for corresponding success/failure actions
    const actionId = action.type.replace('/start', '');
    const checkCompletion = () => {
      // This would need to be implemented with a proper observer pattern
      // For now, just log the start
      console.time(`Action: ${actionId}`);
    };
    
    checkCompletion();
  }
};

// Helper functions
function determineSeverity(action: Action): 'low' | 'medium' | 'high' | 'critical' {
  const { type, payload } = action;
  
  // Authentication errors are high priority
  if (type.startsWith('auth/') && type.includes('failure')) {
    return 'high';
  }
  
  // Network errors
  if (typeof payload === 'string' && payload.toLowerCase().includes('network')) {
    return 'medium';
  }
  
  // Server errors (5xx)
  if (typeof payload === 'string' && payload.includes('500')) {
    return 'critical';
  }
  
  // Validation errors are low priority
  if (type.includes('validation')) {
    return 'low';
  }
  
  // Default to medium
  return 'medium';
}

function isCriticalAction(action: Action): boolean {
  const criticalActions = [
    'auth/logout',
    'app/crash',
    'data/corruption',
    'security/breach',
  ];
  
  return criticalActions.indexOf(action.type) !== -1;
}

function getRelevantState(state: any, action: Action): any {
  // Extract only relevant state based on action type
  const [slice] = action.type.split('/');
  
  const relevantState: any = {};
  
  if (state[slice]) {
    relevantState[slice] = {
      ...state[slice],
      // Remove sensitive data
      token: state[slice].token ? '[REDACTED]' : null,
      password: '[REDACTED]',
    };
  }
  
  // Always include UI state for context
  if (state.ui) {
    relevantState.ui = {
      loading: state.ui.loading,
      errors: state.ui.errors,
      theme: state.ui.theme,
    };
  }
  
  return relevantState;
}

// Error boundary function for components
export const withErrorBoundary = (componentFn: Function, fallbackFn?: Function) => {
  return (...args: any[]) => {
    try {
      return componentFn(...args);
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      
      errorManager.captureError(errorInstance, {
        action: { type: 'component/error' },
        severity: 'medium',
        context: { component: componentFn.name },
      });
      
      if (fallbackFn) {
        return fallbackFn(error);
      }
      
      return {
        html: `
          <div class="error-boundary p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 class="text-red-800 font-semibold">Something went wrong</h3>
            <p class="text-red-600">This component failed to render. Please try refreshing the page.</p>
            <button onclick="window.location.reload()" class="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm">
              Refresh Page
            </button>
          </div>
        `,
      };
    }
  };
};

// Async error handler
export const handleAsync = async <T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, Error | null]> => {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    
    errorManager.captureError(errorInstance, {
      action: { type: 'async/error' },
      severity: 'medium',
      context: { operation: context },
    });
    
    return [null, errorInstance];
  }
};

// Export error manager and utilities
export { errorManager };
export default errorMiddleware;
