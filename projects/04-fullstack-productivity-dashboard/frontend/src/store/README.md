# Redux Store Setup - Clean Architecture

This directory contains a comprehensive, custom Redux-inspired state management system for the Productivity Dashboard application, built without external dependencies.

## 📁 Directory Structure

```
store/
├── store.ts              # Core store implementation with reducers
├── actions.ts            # Action creators for all slices
├── selectors.ts          # State selectors and computed values
├── index.ts              # Main store export and StoreManager
├── middleware/           # Custom middleware implementations
│   ├── apiMiddleware.ts  # API communication and error handling
│   ├── errorMiddleware.ts # Error logging and reporting
│   └── loggingMiddleware.ts # Action logging and performance monitoring
└── README.md            # This documentation
```

## 🏗️ Architecture Overview

### Core Store Implementation (`store.ts`)

The custom store provides Redux-like functionality with:

- **Immutable State Updates**: Pure reducer functions for predictable state changes
- **Action Dispatch System**: Type-safe action dispatch with middleware support
- **Subscription Management**: Observer pattern for component updates
- **State Persistence**: LocalStorage integration for auth and settings
- **TypeScript Integration**: Full type safety across all state slices

**State Slices:**
- `auth`: User authentication and profile management
- `goals`: Goal CRUD operations and filtering
- `timer`: Pomodoro timer and session tracking
- `ui`: Theme, notifications, modals, and loading states
- `settings`: User preferences and configuration
- `analytics`: Productivity insights and reporting

### Action System (`actions.ts`)

Standardized action creators for all operations:

```typescript
// Auth actions
actions.auth.loginStart()
actions.auth.loginSuccess(user, token)
actions.auth.logout()

// Goals actions
actions.goals.add(goal)
actions.goals.update(goalId, updates)
actions.goals.setFilters({ category: 'personal' })

// Timer actions
actions.timer.start(session)
actions.timer.pause()
actions.timer.complete(session)

// UI actions
actions.ui.showSuccess('Goal completed!')
actions.ui.toggleSidebar()
actions.ui.setTheme('dark')

// Async actions (thunks)
actions.async.login(email, password)
actions.async.loadGoals()
actions.async.createGoal(goalData)
```

### Selector System (`selectors.ts`)

Efficient state access with computed values:

```typescript
// Basic selectors
selectors.auth.currentUser(state)
selectors.goals.allGoals(state)
selectors.timer.isTimerRunning(state)

// Computed selectors
selectors.goals.filteredGoals(state) // Filtered and sorted
selectors.goals.goalStats(state) // Statistics
selectors.timer.todaysSessions(state) // Today's sessions

// Cross-slice selectors
selectors.combined.dashboardOverview(state)
selectors.combined.goalWithTimerData(state, goalId)

// Memoized selectors
const expensiveSelector = selectors.createSelector(
  complexComputation,
  [dependency1, dependency2]
);
```

## 🔧 Middleware System

### API Middleware (`apiMiddleware.ts`)

Handles all API communication with:

- **Automatic Authentication**: JWT token management
- **Request Retry Logic**: Exponential backoff for failed requests
- **Error Handling**: Standardized error responses
- **Timeout Management**: Request timeout and cancellation
- **Performance Monitoring**: Request duration tracking

**API Service Methods:**
```typescript
// Authentication
apiService.auth.login(email, password)
apiService.auth.register(userData)
apiService.auth.getProfile()

// Goals
apiService.goals.getAll()
apiService.goals.create(goalData)
apiService.goals.update(id, updates)

// Timer
apiService.timer.getSessions()
apiService.timer.createSession(sessionData)

// Analytics
apiService.analytics.getOverview(dateRange)
apiService.analytics.getTrends(period)
```

### Error Middleware (`errorMiddleware.ts`)

Comprehensive error management:

- **Error Capture**: Automatic error detection and logging
- **Error Reporting**: Remote error reporting with retry logic
- **Error Boundary**: Component-level error protection
- **Context Tracking**: Rich error context and debugging info
- **Error Analytics**: Error statistics and trending

**Error Utilities:**
```typescript
// Error boundary for components
const SafeComponent = withErrorBoundary(MyComponent, FallbackComponent);

// Async error handling
const [result, error] = await handleAsync(apiCall(), 'user-action');

// Manual error capture
errorManager.captureError(error, {
  severity: 'high',
  context: { userId: '123', action: 'goal-create' }
});
```

### Logging Middleware (`loggingMiddleware.ts`)

Development and debugging support:

- **Action Logging**: Detailed action dispatch tracking
- **Performance Monitoring**: Action execution timing
- **State Diff Tracking**: Before/after state comparisons
- **Console Formatting**: Color-coded, collapsible logs
- **Log Export**: CSV/JSON export for analysis

**Logging Features:**
```typescript
// Performance monitoring
logger.monitorPerformance('expensive-operation', () => {
  // expensive computation
});

// Async monitoring
await logger.monitorAsyncPerformance('api-call', apiPromise);

// Log statistics
const stats = logger.getStats();
// { total: 150, byLevel: {...}, slowestActions: [...] }

// Export logs
const csvData = logger.exportLogs('csv');
```

## 🎯 Store Manager API

The `StoreManager` class provides a clean interface for class-based components:

### Basic Operations

```typescript
import { storeManager } from '@/store';

// Get current state
const state = storeManager.getState();

// Subscribe to changes
const unsubscribe = storeManager.subscribe((state) => {
  console.log('State updated:', state);
});

// Dispatch actions
storeManager.dispatch(actions.auth.login(userData));

// Select specific data
const user = storeManager.select(selectors.auth.currentUser);
```

### Convenience Methods

```typescript
// Authentication
await storeManager.login('user@example.com', 'password');
storeManager.logout();

// Goals
await storeManager.loadGoals();
await storeManager.createGoal(goalData);

// Timer
storeManager.startTimer('pomodoro', 1500, goalId);
storeManager.pauseTimer();
storeManager.resumeTimer();

// UI
storeManager.showNotification('success', 'Task completed!');
storeManager.toggleTheme();
storeManager.toggleSidebar();

// Settings
storeManager.updateSettings('notifications', { email: false });
```

## 🔍 Development Tools

### DevTools Integration

```typescript
// Access dev tools (development only)
window.__STORE_DEV_TOOLS__

// Get current state
devTools.getState()

// View action logs
devTools.getLogs({ level: 'error', limit: 10 })

// View error reports
devTools.getErrors()

// Performance statistics
devTools.getStats()

// Export debugging data
devTools.export('json')

// Time travel debugging
devTools.timeTravel.getHistory()
devTools.timeTravel.replayActions(actions)
```

### Debug Console Commands

```javascript
// In browser console (development)

// View current user
__STORE_DEV_TOOLS__.getState().auth.user

// Check timer status
__STORE_DEV_TOOLS__.getState().timer.currentSession

// View recent errors
__STORE_DEV_TOOLS__.getErrors().slice(-5)

// Performance stats
__STORE_DEV_TOOLS__.getStats()

// Clear all logs
__STORE_DEV_TOOLS__.clear()
```

## 🚀 Usage Examples

### Component Integration

```typescript
class DashboardComponent {
  private unsubscribe?: () => void;
  
  constructor() {
    // Subscribe to state changes
    this.unsubscribe = storeManager.subscribe((state) => {
      this.updateUI(state);
    });
    
    // Load initial data
    this.loadDashboardData();
  }
  
  private async loadDashboardData() {
    try {
      await Promise.all([
        storeManager.loadGoals(),
        storeManager.loadAnalytics()
      ]);
    } catch (error) {
      storeManager.showNotification('error', 'Failed to load dashboard data');
    }
  }
  
  private updateUI(state: StoreState) {
    const overview = storeManager.select(selectors.combined.dashboardOverview);
    
    // Update dashboard with new data
    this.renderGoalStats(overview.goalStats);
    this.renderTimerStatus(overview.currentSession);
    this.renderUpcomingDeadlines(overview.upcomingDeadlines);
  }
  
  cleanup() {
    // Clean up subscription
    this.unsubscribe?.();
  }
}
```

### Form Handling

```typescript
class GoalFormComponent {
  private async handleSubmit(formData: any) {
    try {
      // Show loading state
      storeManager.dispatch(actions.ui.setLoading({ goals: true }));
      
      // Create goal
      await storeManager.createGoal(formData);
      
      // Show success message
      storeManager.showNotification('success', 'Goal created successfully!');
      
      // Close modal
      storeManager.closeModal('goalForm');
      
    } catch (error) {
      // Show error message
      storeManager.showNotification('error', 'Failed to create goal');
    } finally {
      // Hide loading state
      storeManager.dispatch(actions.ui.setLoading({ goals: false }));
    }
  }
}
```

### Timer Integration

```typescript
class TimerComponent {
  private timerInterval?: number;
  
  constructor() {
    // Subscribe to timer state
    storeManager.subscribe((state) => {
      const session = storeManager.select(selectors.timer.currentSession);
      this.updateTimerDisplay(session);
    });
  }
  
  startPomodoro(goalId?: string) {
    const settings = storeManager.select(selectors.timer.timerSettings);
    storeManager.startTimer('pomodoro', settings.workDuration, goalId);
    
    // Start countdown
    this.timerInterval = window.setInterval(() => {
      const session = storeManager.select(selectors.timer.currentSession);
      if (session && session.status === 'running') {
        const newTime = session.remainingTime - 1;
        
        if (newTime <= 0) {
          this.completeSession();
        } else {
          storeManager.dispatch(actions.timer.tick(newTime));
        }
      }
    }, 1000);
  }
  
  private completeSession() {
    const session = storeManager.select(selectors.timer.currentSession);
    if (session) {
      storeManager.dispatch(actions.timer.complete({
        ...session,
        status: 'completed',
        endTime: new Date().toISOString()
      }));
      
      storeManager.showNotification('success', 'Pomodoro completed!');
      
      // Clear interval
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
  }
}
```

## 📊 Performance Considerations

### State Updates

- **Immutable Updates**: All state changes create new objects
- **Efficient Selectors**: Memoized selectors prevent unnecessary recalculations
- **Minimal Re-renders**: Components only update when relevant state changes

### Memory Management

- **Subscription Cleanup**: Always unsubscribe to prevent memory leaks
- **Log Rotation**: Automatic log pruning to prevent memory bloat
- **State Persistence**: Only essential data persisted to localStorage

### Bundle Size

- **No External Dependencies**: Custom implementation keeps bundle small
- **Tree Shaking**: Unused selectors and actions can be eliminated
- **Modular Design**: Individual pieces can be imported as needed

## 🧪 Testing Strategy

### Unit Testing

```typescript
describe('Goals Reducer', () => {
  test('should add new goal', () => {
    const initialState = { goals: [] };
    const action = actions.goals.add(mockGoal);
    const newState = goalsReducer(initialState, action);
    
    expect(newState.goals).toHaveLength(1);
    expect(newState.goals[0]).toEqual(mockGoal);
  });
});

describe('Selectors', () => {
  test('should filter goals by category', () => {
    const state = { goals: { goals: mockGoals, filters: { category: 'personal' } } };
    const filtered = selectors.goals.filteredGoals(state);
    
    expect(filtered).toHaveLength(2);
    expect(filtered.every(g => g.category === 'personal')).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Store Integration', () => {
  test('should handle complete auth flow', async () => {
    const store = new Store();
    
    // Login
    store.dispatch(actions.auth.loginStart());
    expect(store.getState().auth.isLoading).toBe(true);
    
    store.dispatch(actions.auth.loginSuccess(mockUser, 'token'));
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toEqual(mockUser);
  });
});
```

## 🔧 Configuration

### Environment Setup

```typescript
// Development configuration
const isDevelopment = window.location.hostname === 'localhost';

if (isDevelopment) {
  // Enable debug logging
  logger.setLogLevel('debug');
  
  // Enable error reporting
  errorManager.setReportingEnabled(true);
  
  // Expose dev tools
  window.__STORE_DEV_TOOLS__ = devTools;
}
```

### API Configuration

```typescript
// Configure API client
const apiConfig = {
  baseUrl: 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
};
```

This Redux store setup provides a solid foundation for scalable state management with excellent developer experience, comprehensive error handling, and powerful debugging capabilities.
