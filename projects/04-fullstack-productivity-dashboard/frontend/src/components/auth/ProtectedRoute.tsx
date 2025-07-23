/**
 * ProtectedRoute Component
 * 
 * Route protection wrapper that checks authentication status
 * and redirects unauthorized users to login page
 */

interface ProtectedRouteProps {
  children: string;
  requiredRole?: 'admin' | 'user' | 'guest';
  fallback?: string;
  redirectTo?: string;
  className?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  loading: boolean;
}

/**
 * ProtectedRoute - Authentication wrapper component
 */
class ProtectedRoute {
  private props: ProtectedRouteProps;
  private authState: AuthState;

  constructor(props: ProtectedRouteProps) {
    this.props = {
      requiredRole: 'user',
      fallback: this.getLoadingHTML(),
      redirectTo: '/auth/login',
      className: '',
      ...props
    };

    this.authState = this.getAuthState();
    this.init();
  }

  private getLoadingHTML(): string {
    return `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    `;
  }

  private getAuthState(): AuthState {
    try {
      const token = localStorage.getItem('auth_token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      return {
        isAuthenticated: !!token && !!user,
        user,
        token,
        loading: false
      };
    } catch (error) {
      console.error('Error reading auth state:', error);
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false
      };
    }
  }

  private checkPermissions(): boolean {
    if (!this.authState.isAuthenticated) {
      return false;
    }

    if (!this.props.requiredRole || this.props.requiredRole === 'user') {
      return true;
    }

    const userRole = this.authState.user?.role || 'user';
    
    // Admin can access everything
    if (userRole === 'admin') {
      return true;
    }

    // Check specific role requirements
    return userRole === this.props.requiredRole;
  }

  private async validateToken(): Promise<boolean> {
    if (!this.authState.token) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authState.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update user data if needed
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            this.authState.user = data.user;
          }
          return true;
        }
      }

      // Token is invalid, clear auth data
      this.clearAuthData();
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false
    };
  }

  private redirectToLogin(): void {
    // Store the current location for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('redirect_after_login', currentPath);
    
    // Redirect to login page
    window.location.href = this.props.redirectTo!;
  }

  private renderUnauthorized(): string {
    return `
      <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div class="max-w-md w-full space-y-8 p-8">
          <div class="text-center">
            <div class="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Access Denied
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
            <div class="mt-6 space-y-4">
              <button onclick="window.location.href='/auth/login'" 
                      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Sign In
              </button>
              <button onclick="window.history.back()" 
                      class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async init(): Promise<void> {
    // Show loading state initially
    this.authState.loading = true;

    // Check basic authentication
    if (!this.checkPermissions()) {
      if (!this.authState.isAuthenticated) {
        this.redirectToLogin();
        return;
      } else {
        // User is authenticated but doesn't have required role
        this.render(this.renderUnauthorized());
        return;
      }
    }

    // Validate token with server
    const isTokenValid = await this.validateToken();
    
    if (!isTokenValid) {
      this.redirectToLogin();
      return;
    }

    this.authState.loading = false;
    this.render(this.props.children);
  }

  private render(content: string): void {
    const container = document.getElementById('protected-route-container') || document.body;
    if (container) {
      container.innerHTML = content;
    }
  }

  public refresh(): void {
    this.authState = this.getAuthState();
    this.init();
  }

  public static create(props: ProtectedRouteProps): ProtectedRoute {
    return new ProtectedRoute(props);
  }
}

// Export for use in other components
export { ProtectedRoute };
export type { ProtectedRouteProps };

// Usage example:
/*
const protectedRoute = ProtectedRoute.create({
  children: '<div>Protected content here</div>',
  requiredRole: 'user',
  redirectTo: '/auth/login'
});
*/
