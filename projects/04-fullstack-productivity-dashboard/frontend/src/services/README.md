# API Communication System

Comprehensive request/response flow implementation following the pattern:
**Component → Redux Action → API Service → HttpClient → Express Route → MongoDB → Response → Redux State Update → UI Update**

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Redux Actions  │    │  API Services   │
│   Components    │───▶│  Integration    │───▶│     Layer       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Express     │    │   HTTP Client   │    │   Middleware    │
│     Backend     │◀───│   with Retry    │◀───│   (API/Error)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │
┌─────────────────┐
│    MongoDB      │
│    Database     │
└─────────────────┘
```

## 🗂️ File Structure

```
src/services/
├── httpClient.ts          # Core HTTP client with retry logic
├── apiServices.ts         # High-level API service methods
├── reduxIntegration.ts    # Redux-integrated actions
├── examples.ts            # Usage examples and demos
└── index.ts              # Central exports and quick API
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { api } from './services';

// Simple authentication
const success = await api.login('user@example.com', 'password123');

// Load goals with automatic state updates
await api.getGoals();

// Create goal with Redux integration
await api.createGoal({
  title: 'Complete Project',
  category: 'professional',
  priority: 'high',
  targetDate: '2025-01-31T00:00:00Z'
});
```

### React Component Integration

```typescript
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../services';

function GoalsComponent() {
  const goals = useSelector(state => state.goals.goals);
  const isLoading = api.isLoading('GOALS_FETCH');
  const error = api.getError('GOALS_FETCH');
  
  useEffect(() => {
    api.getGoals();
  }, []);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Goals ({goals.length})</h2>
      {goals.map(goal => (
        <div key={goal.id}>
          <h3>{goal.title}</h3>
          <p>Progress: {goal.progress}%</p>
        </div>
      ))}
    </div>
  );
}
```

## 📊 Core Components

### 1. HTTP Client (`httpClient.ts`)

Advanced HTTP client with:
- **Retry Logic**: Exponential backoff for failed requests
- **Authentication**: Automatic token handling
- **Error Handling**: Comprehensive error categorization
- **File Upload**: Support for multipart/form-data
- **Health Checks**: Backend connectivity monitoring

```typescript
import { httpClient } from './services';

// Configure base URL and timeout
httpClient.configure({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

// Make authenticated requests
const response = await httpClient.get('/goals');
```

### 2. API Services (`apiServices.ts`)

High-level service classes for each domain:

#### AuthService
- Login/logout with token management
- User profile management
- Password operations
- Token refresh

#### GoalsService
- CRUD operations for goals
- Progress tracking
- Sub-goals management
- Filtering and search

#### TimerService
- Timer session management
- Statistics tracking
- Session history

#### AnalyticsService
- Data overview and trends
- Productivity statistics
- Data export functionality

### 3. Redux Integration (`reduxIntegration.ts`)

Seamless Redux state management:
- **Automatic Loading States**: UI loading indicators
- **Error Handling**: Centralized error management  
- **State Updates**: Automatic Redux store updates
- **Action Creators**: Type-safe async actions

```typescript
import { reduxActions } from './services';

// Login with automatic Redux updates
const success = await reduxActions.auth.login(email, password);

// Check loading and error states
const isLoading = reduxActions.isLoading('AUTH_LOGIN');
const error = reduxActions.getError('AUTH_LOGIN');
```

## 🔄 Request/Response Flow

### Complete Flow Example

1. **Component Action**
   ```typescript
   <button onClick={() => api.createGoal(goalData)}>
     Create Goal
   </button>
   ```

2. **Redux Action Dispatch**
   ```typescript
   // Automatically sets loading: true
   store.dispatch({ type: 'ui/SET_LOADING', payload: { key: 'GOALS_CREATE', loading: true }});
   ```

3. **API Service Call**
   ```typescript
   const response = await apiServices.goals.create(goalData);
   ```

4. **HTTP Client Request**
   ```typescript
   POST /api/goals
   Headers: { 'Authorization': 'Bearer <token>' }
   Body: { title: 'New Goal', category: 'personal', ... }
   ```

5. **Express Route Handler**
   ```typescript
   router.post('/goals', authMiddleware, goalController.create);
   ```

6. **MongoDB Operation**
   ```typescript
   const goal = new Goal(goalData);
   await goal.save();
   ```

7. **Response Back to Frontend**
   ```json
   {
     "success": true,
     "data": { 
       "id": "goal_123",
       "title": "New Goal",
       "createdAt": "2025-01-11T...",
       ...
     }
   }
   ```

8. **Redux State Update**
   ```typescript
   store.dispatch({
     type: 'goals/ADD_GOAL',
     payload: response.data
   });
   ```

9. **UI Update**
   ```typescript
   // Component re-renders with new goal in list
   const goals = useSelector(state => state.goals.goals);
   ```

## 🛠️ Error Handling

### Automatic Error Management

```typescript
// Errors are automatically captured and stored
const success = await api.updateGoal('invalid-id', updates);

if (!success) {
  const error = api.getError('GOALS_UPDATE');
  console.log('Error:', error); // "Goal not found"
  
  // Clear error when ready
  api.clearError('GOALS_UPDATE');
}
```

### Error Types Handled
- **Network Errors**: Connection timeouts, server unavailable
- **HTTP Errors**: 400, 401, 404, 500, etc.
- **Validation Errors**: Invalid request data
- **Authentication Errors**: Token expiry, unauthorized access

## 🔐 Authentication

### Token Management

```typescript
// Login automatically sets token
await api.login(email, password);

// Token persisted in localStorage
// Automatically attached to subsequent requests

// Manual token management
apiServices.setAuthToken(token);

// Token refresh
await reduxActions.auth.refreshToken();
```

### Auth State

```typescript
const authState = useSelector(state => state.auth);
// {
//   user: { id, email, name, ... },
//   token: "jwt_token_string",
//   isAuthenticated: true,
//   isLoading: false,
//   error: null
// }
```

## 📈 Loading States

### Granular Loading Management

```typescript
// Check specific loading states
const isLoginLoading = api.isLoading('AUTH_LOGIN');
const isGoalsLoading = api.isLoading('GOALS_FETCH');
const isCreatingGoal = api.isLoading('GOALS_CREATE');

// Global loading state
const globalLoading = useSelector(state => state.ui.loading.global);
```

### Loading UI Patterns

```typescript
function LoadingButton({ onClick, loading, children }) {
  return (
    <button onClick={onClick} disabled={loading}>
      {loading ? 'Loading...' : children}
    </button>
  );
}

// Usage
<LoadingButton 
  loading={api.isLoading('GOALS_CREATE')}
  onClick={() => api.createGoal(data)}
>
  Create Goal
</LoadingButton>
```

## 🧪 Testing & Development

### Development Utilities

```typescript
import { devUtils } from './services';

// Inspect current API state
devUtils.inspectApiState();

// Test backend connectivity
await devUtils.testConnectivity();

// Enable API mocking (development only)
devUtils.enableMocking({
  'GET /api/goals': [{ id: '1', title: 'Mock Goal' }],
  'POST /api/auth/login': { user: {...}, token: 'mock_token' }
});
```

### Example Flows

```typescript
import { examples } from './services/examples';

// Run individual example flows
await examples.login();
await examples.goals();
await examples.timer();
await examples.dashboard();

// Run complete system demonstration
await examples.runAll();
```

## 🔧 Configuration

### HTTP Client Configuration

```typescript
httpClient.configure({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504]
});
```

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENABLE_API_MOCKING=false
REACT_APP_DEBUG_API=true
```

## 🚦 Production Considerations

### Performance
- **Request Caching**: Implement caching for repeated requests
- **Bundle Splitting**: Code-split API services by feature
- **Connection Pooling**: Reuse HTTP connections

### Security
- **Token Refresh**: Automatic token renewal
- **HTTPS Only**: Enforce secure connections
- **Request Validation**: Client-side request validation

### Monitoring
- **Error Tracking**: Integration with Sentry/LogRocket
- **Performance Metrics**: API call timing and success rates
- **Health Checks**: Regular backend connectivity tests

## 📚 API Reference

### Core API Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `api.login(email, password)` | Authenticate user | `Promise<boolean>` |
| `api.getGoals(params?)` | Fetch goals with filters | `Promise<boolean>` |
| `api.createGoal(data)` | Create new goal | `Promise<boolean>` |
| `api.updateGoal(id, updates)` | Update existing goal | `Promise<boolean>` |
| `api.deleteGoal(id)` | Delete goal | `Promise<boolean>` |
| `api.startTimer(data)` | Start timer session | `Promise<boolean>` |
| `api.getDashboard()` | Load dashboard data | `Promise<boolean>` |
| `api.isLoading(action)` | Check loading state | `boolean` |
| `api.getError(action)` | Get error message | `string \| null` |

### Redux Action Types

| Action Type | Description |
|-------------|-------------|
| `AUTH_LOGIN` | User login process |
| `AUTH_LOGOUT` | User logout process |
| `GOALS_FETCH` | Loading goals list |
| `GOALS_CREATE` | Creating new goal |
| `GOALS_UPDATE` | Updating goal |
| `GOALS_DELETE` | Deleting goal |
| `TIMER_CREATE_SESSION` | Starting timer |
| `TIMER_UPDATE_SESSION` | Updating timer |
| `DASHBOARD_FETCH_SUMMARY` | Loading dashboard |

## 🎯 Best Practices

1. **Always check loading states** before showing loading UI
2. **Handle errors gracefully** with user-friendly messages  
3. **Use TypeScript** for type safety across the API layer
4. **Implement optimistic updates** for better UX
5. **Cache frequently requested data** to reduce API calls
6. **Use retry logic** for transient network failures
7. **Monitor API performance** in production

## 🏗️ Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Offline support with request queuing
- [ ] GraphQL adapter layer
- [ ] Advanced caching with cache invalidation
- [ ] Request/response interceptor plugins
- [ ] API call analytics and monitoring

---

This API Communication system provides a robust, type-safe, and developer-friendly foundation for full-stack React applications with comprehensive state management and error handling.
