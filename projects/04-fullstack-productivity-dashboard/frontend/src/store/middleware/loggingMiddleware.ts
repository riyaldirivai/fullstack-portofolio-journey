/**
 * Logging Middleware
 * 
 * Provides comprehensive logging for store actions and state changes.
 * Includes performance monitoring, action tracking, and debug information.
 */

import type { Action } from '../store';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  action: Action;
  stateBefore?: any;
  stateAfter?: any;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = true;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
  private actionTimers: Map<string, number> = new Map();

  constructor() {
    // Enable debug logging in development
    const isDevelopment = window.location.hostname === 'localhost';
    if (isDevelopment) {
      this.logLevel = 'debug';
      this.enabled = true;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!this.enabled) return false;
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  log(
    level: 'debug' | 'info' | 'warn' | 'error',
    action: Action,
    options: {
      stateBefore?: any;
      stateAfter?: any;
      duration?: number;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      ...options,
    };

    // Add to logs
    this.logs.push(logEntry);

    // Maintain log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console logging with styling
    this.logToConsole(logEntry);
  }

  private logToConsole(entry: LogEntry): void {
    const { level, action, duration, metadata } = entry;
    
    // Color coding for different levels
    const colors = {
      debug: '#6B7280', // gray
      info: '#3B82F6',  // blue
      warn: '#F59E0B',  // yellow
      error: '#EF4444', // red
    };

    const actionTypeColor = this.getActionTypeColor(action.type);
    
    const groupTitle = `%c${level.toUpperCase()}%c ${action.type}${duration ? ` (${duration}ms)` : ''}`;
    const groupStyle = `color: ${colors[level]}; font-weight: bold;`;
    const actionStyle = `color: ${actionTypeColor}; font-weight: normal;`;

    console.groupCollapsed(groupTitle, groupStyle, actionStyle);
    
    // Action details
    console.log('%cAction:', 'font-weight: bold; color: #374151;', action);
    
    // Payload
    if (action.payload !== undefined) {
      console.log('%cPayload:', 'font-weight: bold; color: #374151;', action.payload);
    }
    
    // Duration
    if (duration !== undefined) {
      const durationColor = duration > 100 ? '#EF4444' : duration > 50 ? '#F59E0B' : '#10B981';
      console.log(`%cDuration: ${duration}ms`, `color: ${durationColor}; font-weight: bold;`);
    }
    
    // Metadata
    if (metadata && Object.keys(metadata).length > 0) {
      console.log('%cMetadata:', 'font-weight: bold; color: #374151;', metadata);
    }
    
    // State diff (only in debug level)
    if (this.logLevel === 'debug' && entry.stateBefore && entry.stateAfter) {
      this.logStateDiff(entry.stateBefore, entry.stateAfter, action.type);
    }
    
    console.groupEnd();
  }

  private getActionTypeColor(actionType: string): string {
    const [slice] = actionType.split('/');
    
    const sliceColors: Record<string, string> = {
      auth: '#8B5CF6',     // purple
      goals: '#10B981',    // green
      timer: '#F59E0B',    // orange
      ui: '#3B82F6',       // blue
      settings: '#6B7280', // gray
      analytics: '#EC4899', // pink
    };
    
    return sliceColors[slice] || '#374151';
  }

  private logStateDiff(before: any, after: any, actionType: string): void {
    const [slice] = actionType.split('/');
    
    if (before[slice] && after[slice]) {
      const beforeSlice = before[slice];
      const afterSlice = after[slice];
      
      const diff = this.getObjectDiff(beforeSlice, afterSlice);
      
      if (Object.keys(diff).length > 0) {
        console.log('%cState Changes:', 'font-weight: bold; color: #059669;', diff);
      }
    }
  }

  private getObjectDiff(obj1: any, obj2: any): Record<string, any> {
    const diff: Record<string, any> = {};
    
    // Check for changes in obj2
    for (const key in obj2) {
      if (obj1[key] !== obj2[key]) {
        diff[key] = {
          before: obj1[key],
          after: obj2[key],
        };
      }
    }
    
    // Check for deletions
    for (const key in obj1) {
      if (!(key in obj2)) {
        diff[key] = {
          before: obj1[key],
          after: undefined,
        };
      }
    }
    
    return diff;
  }

  startTimer(actionType: string): void {
    this.actionTimers.set(actionType, performance.now());
  }

  endTimer(actionType: string): number | undefined {
    const startTime = this.actionTimers.get(actionType);
    if (startTime) {
      const duration = Math.round(performance.now() - startTime);
      this.actionTimers.delete(actionType);
      return duration;
    }
    return undefined;
  }

  getLogs(options: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    actionType?: string;
    since?: string;
    limit?: number;
  } = {}): LogEntry[] {
    let filtered = [...this.logs];
    
    // Filter by level
    if (options.level) {
      filtered = filtered.filter(log => log.level === options.level);
    }
    
    // Filter by action type
    if (options.actionType) {
      const actionTypeFilter = options.actionType;
      filtered = filtered.filter(log => log.action.type.indexOf(actionTypeFilter) !== -1);
    }
    
    // Filter by timestamp
    if (options.since) {
      const sinceTime = new Date(options.since).getTime();
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime);
    }
    
    // Limit results
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }

  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byActionType: Record<string, number>;
    averageDuration: number;
    slowestActions: Array<{ actionType: string; duration: number }>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      byActionType: {} as Record<string, number>,
      averageDuration: 0,
      slowestActions: [] as Array<{ actionType: string; duration: number }>,
    };

    let totalDuration = 0;
    let durationsCount = 0;
    const actionDurations: Record<string, number[]> = {};

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level]++;
      
      // Count by action type
      const actionType = log.action.type;
      stats.byActionType[actionType] = (stats.byActionType[actionType] || 0) + 1;
      
      // Track durations
      if (log.duration !== undefined) {
        totalDuration += log.duration;
        durationsCount++;
        
        if (!actionDurations[actionType]) {
          actionDurations[actionType] = [];
        }
        actionDurations[actionType].push(log.duration);
      }
    });

    // Calculate average duration
    stats.averageDuration = durationsCount > 0 ? Math.round(totalDuration / durationsCount) : 0;

    // Find slowest actions
    const slowestActions: Array<{ actionType: string; duration: number }> = [];
    
    for (const actionType in actionDurations) {
      const durations = actionDurations[actionType];
      const avgDuration = Math.round(durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length);
      slowestActions.push({ actionType, duration: avgDuration });
    }
    
    slowestActions.sort((a: { duration: number }, b: { duration: number }) => b.duration - a.duration);
    stats.slowestActions = slowestActions.slice(0, 5);

    return stats;
  }

  clearLogs(): void {
    this.logs = [];
    this.actionTimers.clear();
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'actionType', 'duration', 'payload'];
      const rows = this.logs.map(log => [
        log.timestamp,
        log.level,
        log.action.type,
        log.duration || '',
        JSON.stringify(log.action.payload || ''),
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance monitoring
  monitorPerformance(actionType: string, fn: Function): any {
    const startTime = performance.now();
    
    try {
      const result = fn();
      const duration = Math.round(performance.now() - startTime);
      
      this.log('debug', { type: actionType }, {
        duration,
        metadata: { performance: 'sync' },
      });
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      this.log('error', { type: actionType }, {
        duration,
        metadata: { performance: 'sync', error: String(error) },
      });
      
      throw error;
    }
  }

  async monitorAsyncPerformance(actionType: string, promise: Promise<any>): Promise<any> {
    const startTime = performance.now();
    
    try {
      const result = await promise;
      const duration = Math.round(performance.now() - startTime);
      
      this.log('debug', { type: actionType }, {
        duration,
        metadata: { performance: 'async' },
      });
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      
      this.log('error', { type: actionType }, {
        duration,
        metadata: { performance: 'async', error: String(error) },
      });
      
      throw error;
    }
  }
}

// Create logger instance
const logger = new Logger();

// Logging middleware function
export const loggingMiddleware = (action: Action, state: any) => {
  // Start timer for async actions
  if (action.type.endsWith('/start')) {
    logger.startTimer(action.type.replace('/start', ''));
  }

  // End timer and log completion
  if (action.type.endsWith('/success') || action.type.endsWith('/failure')) {
    const baseActionType = action.type.replace(/(\/success|\/failure)$/, '');
    const duration = logger.endTimer(baseActionType);
    
    const level = action.type.endsWith('/failure') ? 'error' : 'info';
    
    logger.log(level, action, {
      duration,
      metadata: {
        async: true,
        status: action.type.endsWith('/success') ? 'success' : 'failure',
      },
    });
  } else {
    // Log regular actions
    logger.log('debug', action, {
      metadata: {
        async: false,
        timestamp: Date.now(),
      },
    });
  }

  // Log critical actions at higher level
  const criticalActions = ['auth/logout', 'auth/loginSuccess', 'timer/complete'];
  if (criticalActions.indexOf(action.type) !== -1) {
    logger.log('info', action, {
      metadata: { critical: true },
    });
  }

  // Performance warnings
  const slowActions = ['goals/loadSuccess', 'analytics/loadSuccess'];
  if (slowActions.indexOf(action.type) !== -1 && action.payload?.length > 100) {
    logger.log('warn', action, {
      metadata: { 
        performance: 'large_payload',
        size: Array.isArray(action.payload) ? action.payload.length : 'unknown'
      },
    });
  }
};

// Export logger and utilities
export { logger };
export default loggingMiddleware;
