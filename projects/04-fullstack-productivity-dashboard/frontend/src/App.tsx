// App Configuration and Router Setup
interface AppConfig {
  name: string;
  version: string;
  apiUrl: string;
  features: {
    auth: boolean;
    darkMode: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

interface Route {
  path: string;
  component: string;
  layout: string;
  protected: boolean;
  exact?: boolean;
  children?: Route[];
}

interface AppState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: any | null;
  theme: 'light' | 'dark' | 'system';
  notifications: any[];
  error: string | null;
}

/**
 * Application configuration
 */
export const appConfig: AppConfig = {
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

/**
 * Application routes configuration
 */
export const routes: Route[] = [
  // Public routes (authentication)
  {
    path: '/auth',
    component: 'AuthLayout',
    layout: 'auth',
    protected: false,
    children: [
      {
        path: '/auth/login',
        component: 'LoginPage',
        layout: 'auth',
        protected: false,
        exact: true
      },
      {
        path: '/auth/register',
        component: 'RegisterPage',
        layout: 'auth',
        protected: false,
        exact: true
      },
      {
        path: '/auth/forgot-password',
        component: 'ForgotPasswordPage',
        layout: 'auth',
        protected: false,
        exact: true
      }
    ]
  },
  
  // Protected routes (main application)
  {
    path: '/',
    component: 'MainLayout',
    layout: 'main',
    protected: true,
    children: [
      {
        path: '/dashboard',
        component: 'DashboardPage',
        layout: 'main',
        protected: true,
        exact: true
      },
      {
        path: '/goals',
        component: 'GoalsPage',
        layout: 'main',
        protected: true,
        exact: true
      },
      {
        path: '/timer',
        component: 'TimerPage',
        layout: 'main',
        protected: true,
        exact: true
      },
      {
        path: '/analytics',
        component: 'AnalyticsPage',
        layout: 'main',
        protected: true,
        exact: true
      },
      {
        path: '/settings',
        component: 'SettingsPage',
        layout: 'main',
        protected: true,
        exact: true
      },
      {
        path: '/profile',
        component: 'ProfilePage',
        layout: 'main',
        protected: true,
        exact: true
      }
    ]
  },
  
  // Error routes
  {
    path: '/404',
    component: 'NotFoundPage',
    layout: 'error',
    protected: false,
    exact: true
  }
];

/**
 * App class for managing application state and routing
 */
export class App {
  private state: AppState;
  private container: HTMLElement;
  private currentRoute: string;

  constructor(container: HTMLElement) {
    this.container = container;
    this.currentRoute = window.location.pathname;
    this.state = {
      isLoading: true,
      isAuthenticated: false,
      user: null,
      theme: this.getInitialTheme(),
      notifications: [],
      error: null
    };

    this.initialize();
  }

  /**
   * Initialize the application
   */
  private async initialize(): Promise<void> {
    try {
      // Show loading state
      this.renderLoading();

      // Initialize theme
      this.applyTheme(this.state.theme);

      // Check authentication status
      await this.checkAuthStatus();

      // Setup router
      this.setupRouter();

      // Render initial route
      this.handleRouteChange();

      // Setup event listeners
      this.setupEventListeners();

      this.state.isLoading = false;
    } catch (error) {
      console.error('App initialization error:', error);
      this.state.error = 'Failed to initialize application';
      this.renderError();
    }
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  private getInitialTheme(): 'light' | 'dark' | 'system' {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme;
    }
    return 'system';
  }

  /**
   * Apply theme to document
   */
  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    localStorage.setItem('theme', theme);
    this.state.theme = theme;
  }

  /**
   * Check authentication status
   */
  private async checkAuthStatus(): Promise<void> {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Here we would verify token with API
        // For now, just check if token exists
        this.state.isAuthenticated = true;
        // this.state.user = await verifyToken(token);
      } catch (error) {
        localStorage.removeItem('authToken');
        this.state.isAuthenticated = false;
        this.state.user = null;
      }
    }
  }

  /**
   * Setup browser router
   */
  private setupRouter(): void {
    // Handle back/forward browser navigation
    window.addEventListener('popstate', () => {
      this.currentRoute = window.location.pathname;
      this.handleRouteChange();
    });
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // Theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.state.theme === 'system') {
        this.applyTheme('system');
      }
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showNotification('An unexpected error occurred', 'error');
    });

    // Global click handler for navigation
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('[data-route]');
      
      if (link) {
        event.preventDefault();
        const route = link.getAttribute('data-route');
        if (route) {
          this.navigate(route);
        }
      }
    });
  }

  /**
   * Handle route changes
   */
  private handleRouteChange(): void {
    const route = this.findRoute(this.currentRoute);
    
    if (!route) {
      this.navigate('/404');
      return;
    }

    // Check if route requires authentication
    if (route.protected && !this.state.isAuthenticated) {
      this.navigate('/auth/login');
      return;
    }

    // Redirect authenticated users away from auth pages
    if (!route.protected && this.state.isAuthenticated && this.currentRoute.startsWith('/auth')) {
      this.navigate('/dashboard');
      return;
    }

    this.renderRoute(route);
  }

  /**
   * Find route configuration by path
   */
  private findRoute(path: string): Route | null {
    for (const route of routes) {
      if (route.path === path || path.startsWith(route.path)) {
        if (route.children) {
          for (const childRoute of route.children) {
            if (childRoute.path === path) {
              return childRoute;
            }
          }
        }
        if (route.exact && route.path !== path) {
          continue;
        }
        return route;
      }
    }
    return null;
  }

  /**
   * Navigate to a new route
   */
  public navigate(path: string): void {
    if (path !== this.currentRoute) {
      this.currentRoute = path;
      window.history.pushState(null, '', path);
      this.handleRouteChange();
    }
  }

  /**
   * Render loading state
   */
  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Initializing Productivity Dashboard...
          </p>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Setting up your workspace...
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  private renderError(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Application Error
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ${this.state.error}
          </p>
          <button
            onclick="location.reload()"
            class="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render a route
   */
  private renderRoute(route: Route): void {
    // This would render the appropriate component based on the route
    // For now, we'll create a placeholder
    this.container.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            ${route.component}
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Route: ${route.path}
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            Layout: ${route.layout}
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            Protected: ${route.protected ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Show notification
   */
  public showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };

    this.state.notifications.push(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  /**
   * Remove notification
   */
  public removeNotification(id: string): void {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
  }

  /**
   * Login user
   */
  public login(userData: any): void {
    this.state.isAuthenticated = true;
    this.state.user = userData;
    this.navigate('/dashboard');
  }

  /**
   * Logout user
   */
  public logout(): void {
    localStorage.removeItem('authToken');
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.navigate('/auth/login');
  }

  /**
   * Toggle theme
   */
  public toggleTheme(): void {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  /**
   * Get current state
   */
  public getState(): AppState {
    return { ...this.state };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('root');
  if (appContainer) {
    new App(appContainer);
  }
});

export default App;
