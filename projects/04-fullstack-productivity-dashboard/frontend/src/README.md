# Main App Structure

This directory contains the main application structure including routing, layouts, and entry point.

## Files Overview

### App.tsx
The main application class that manages:
- **Application Configuration**: API URLs, feature flags, and app settings
- **Routing System**: Client-side routing with protected and public routes
- **Authentication State**: User authentication and session management
- **Theme Management**: Light/dark mode with system preference detection
- **Global Error Handling**: Application-wide error boundary and recovery
- **Notification System**: Global notification management

**Key Features:**
```typescript
// App Configuration
export const appConfig = {
  name: 'Productivity Dashboard',
  version: '1.0.0',
  apiUrl: 'http://localhost:3001/api',
  features: {
    auth: true,
    darkMode: true,
    notifications: true,
    analytics: true
  }
};

// Routes Configuration
const routes = [
  // Public routes (auth pages)
  { path: '/auth/login', component: 'LoginPage', protected: false },
  { path: '/auth/register', component: 'RegisterPage', protected: false },
  
  // Protected routes (main app)
  { path: '/dashboard', component: 'DashboardPage', protected: true },
  { path: '/goals', component: 'GoalsPage', protected: true },
  // ... more routes
];
```

### index.tsx
Application entry point that handles:
- **DOM Initialization**: Mounting the app to the root element
- **Development Tools**: Hot Module Replacement (HMR) support
- **Service Worker**: PWA functionality registration
- **Performance Monitoring**: Development performance metrics
- **Error Recovery**: Fallback UI for startup errors

### utils/router.ts
Custom router implementation providing:
- **Client-side Navigation**: SPA routing without page refreshes
- **Route Parameters**: Dynamic route segments and query parameters
- **Browser History**: Back/forward navigation support
- **Route Guards**: Authentication and authorization checks
- **Navigation Events**: Route change listeners and callbacks

**Router API:**
```typescript
import { router, navigate, goBack, getLocation } from './utils/router';

// Navigation
navigate('/dashboard');
goBack();

// Route information
const location = getLocation();
const isActive = router.isActive('/dashboard');

// Listen for route changes
const unsubscribe = router.listen((location) => {
  console.log('Route changed:', location.pathname);
});
```

## Layout Components

### MainLayout.tsx
Main application layout featuring:
- **Responsive Sidebar**: Collapsible navigation with mobile support
- **Header Bar**: Page title, theme toggle, notifications, user menu
- **Navigation Menu**: Dashboard, Goals, Timer, Analytics, Settings
- **User Profile**: Avatar, name, logout functionality
- **Theme Toggle**: Light/dark mode switching
- **Mobile Support**: Overlay sidebar for mobile devices

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ Sidebar    │ Header (Theme, User)   │
│ ┌─────────┐│ ┌─────────────────────┐ │
│ │ Logo    ││ │ Page Title  [🌙][🔔]│ │
│ │ Nav     ││ │                     │ │
│ │ • Dash  ││ ├─────────────────────┤ │
│ │ • Goals ││ │                     │ │
│ │ • Timer ││ │ Main Content Area   │ │
│ │ • Stats ││ │                     │ │
│ │         ││ │                     │ │
│ │ Profile ││ │                     │ │
│ └─────────┘│ └─────────────────────┘ │
└─────────────────────────────────────┘
```

### AuthLayout.tsx
Authentication layout for login/register pages:
- **Centered Design**: Card-based layout with gradient background
- **Responsive**: Mobile-first approach with fluid containers
- **Branding**: Logo and application name display
- **Navigation Links**: Switch between login, register, forgot password
- **Theme Support**: Dark mode compatibility
- **Footer**: Copyright and legal information

**Auth Layout Structure:**
```
┌───────────────────────────────────┐
│   [Gradient Background]           │
│                                   │
│  ┌─────────────────────────────┐  │
│  │         [P] Logo            │  │
│  │      Welcome Back!          │  │
│  │                             │  │
│  │ ┌─────────────────────────┐ │  │
│  │ │     Auth Form Card      │ │  │
│  │ │   [Login/Register]      │ │  │
│  │ └─────────────────────────┘ │  │
│  │                             │  │
│  │   [Login] | [Register]      │  │
│  │      © 2025 Company         │  │
│  └─────────────────────────────┘  │
│                                   │
│              [🌙]                │
└───────────────────────────────────┘
```

## Key Features

### 🔐 Authentication Flow
```typescript
// Login process
app.login(userData) → navigate('/dashboard')

// Logout process  
app.logout() → navigate('/auth/login')

// Route protection
if (route.protected && !isAuthenticated) {
  navigate('/auth/login');
}
```

### 🎨 Theme Management
```typescript
// Theme switching
app.toggleTheme() // light ↔ dark

// System preference detection
theme: 'system' // auto-detect user preference

// Persistence
localStorage.setItem('theme', 'dark');
```

### 🚀 Navigation System
```typescript
// Programmatic navigation
app.navigate('/goals');

// Link-based navigation
<a data-route="/timer">Timer</a>

// Browser integration
window.history.pushState() // updates URL
window.addEventListener('popstate') // handles back/forward
```

### 📱 Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: Tailwind CSS responsive utilities
- **Touch-friendly**: Large touch targets and gestures
- **Progressive Enhancement**: Works without JavaScript

### ⚡ Performance
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Separate bundles for routes
- **Service Worker**: Offline functionality and caching
- **Hot Reloading**: Fast development iteration

## Usage Examples

### Basic App Setup
```typescript
// Initialize app
const app = new App(document.getElementById('root'));

// Access app globally (development)
window.app = app;

// Navigation
app.navigate('/dashboard');

// Theme
app.toggleTheme();

// Authentication
app.login(userData);
app.logout();
```

### Custom Route Handling
```typescript
// Listen for route changes
router.listen((location) => {
  // Update page title
  document.title = getPageTitle(location.pathname);
  
  // Analytics tracking
  analytics.track('page_view', { path: location.pathname });
});
```

### Layout Integration
```typescript
// Render with layout
const layout = MainLayout({
  user: currentUser,
  onLogout: () => app.logout()
});

// Update content area
document.getElementById('page-content').innerHTML = layout.html;
```

## Error Handling

The app includes comprehensive error handling:
- **Startup Errors**: Fallback UI if app fails to initialize
- **Route Errors**: 404 page for invalid routes
- **Authentication Errors**: Automatic redirect to login
- **Network Errors**: Retry mechanisms and user feedback
- **Global Errors**: Error boundary with recovery options

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful degradation for older browsers
- **Polyfills**: ES6+ features for broader compatibility

This main app structure provides a solid foundation for a modern, responsive, and feature-rich productivity dashboard application.
