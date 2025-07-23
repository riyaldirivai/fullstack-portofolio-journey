/**
 * Authentication Middleware
 * 
 * Handles automatic token injection, refresh, and protected route access
 * Following the flow: Include in Headers → Middleware Check → Verify Token → Protected Access
 */

import { httpClient } from './httpClient';
import { AuthFlow, TokenManager } from './authFlow';
import { store } from '../store';

// ========================================
// 🛡️ AUTHENTICATION MIDDLEWARE
// ========================================

export class AuthMiddleware {
  private static isInitialized = false;
  private static refreshPromise: Promise<boolean> | null = null;

  /**
   * Initialize authentication middleware
   */
  static initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ AuthMiddleware already initialized');
      return;
    }

    console.log('🔧 Initializing Authentication Middleware...');

    // Setup request interceptor
    this.setupRequestInterceptor();
    
    // Setup response interceptor
    this.setupResponseInterceptor();
    
    // Setup automatic token refresh
    this.setupTokenRefresh();

    this.isInitialized = true;
    console.log('✅ Authentication Middleware initialized');
  }

  /**
   * STEP 5: Include in Headers (Request Interceptor)
   * Automatically inject authentication token into requests
   */
  private static setupRequestInterceptor(): void {
    console.log('🔧 Setting up request interceptor...');

    // Extend HttpClient to add request interceptor
    const originalRequest = httpClient.request;

    // @ts-ignore - We're extending the private method
    httpClient.request = async function(method, endpoint, data, config = {}) {
      console.log(`🔍 Request Interceptor: ${method} ${endpoint}`);

      // Step 5: Include authentication token in headers
      const { accessToken } = TokenManager.getStoredTokens();
      
      if (accessToken && !TokenManager.isTokenExpired()) {
        console.log('✅ Including auth token in headers');
        
        if (!config.headers) {
          config.headers = {};
        }
        
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      } else if (accessToken && TokenManager.isTokenExpired()) {
        console.log('⏰ Token expired, attempting refresh...');
        
        // Try to refresh token before making request
        const refreshed = await AuthMiddleware.refreshTokenIfNeeded();
        
        if (refreshed) {
          const { accessToken: newToken } = TokenManager.getStoredTokens();
          if (newToken) {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer ${newToken}`;
          }
        }
      }

      // Add request ID for tracking
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = AuthMiddleware.generateRequestId();

      // Call original request method
      return originalRequest.call(this, method, endpoint, data, config);
    };
  }

  /**
   * STEP 6-7: Middleware Check & Verify Token (Response Interceptor)
   * Handle authentication responses and automatic token refresh
   */
  private static setupResponseInterceptor(): void {
    console.log('🔧 Setting up response interceptor...');

    // Store original request method for retry
    const originalRequest = httpClient.request;

    // Override the request method to handle responses
    // @ts-ignore
    const originalHandleResponse = httpClient.handleResponse || function(response) { return response; };

    // Add response handling
    // @ts-ignore
    httpClient.handleResponse = async function(response, method, endpoint, data, config) {
      console.log(`🔍 Response Interceptor: ${response.status} ${method} ${endpoint}`);

      // STEP 6-7: Handle authentication failures
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Token verification failed');
        
        // Try to refresh token
        const refreshed = await AuthMiddleware.refreshTokenIfNeeded();
        
        if (refreshed) {
          console.log('✅ Token refreshed, retrying request...');
          
          // Retry the original request with new token
          const { accessToken } = TokenManager.getStoredTokens();
          const retryConfig = { ...config };
          retryConfig.headers = retryConfig.headers || {};
          retryConfig.headers['Authorization'] = `Bearer ${accessToken}`;
          
          // @ts-ignore
          return originalRequest.call(this, method, endpoint, data, retryConfig);
        } else {
          console.log('❌ Token refresh failed, clearing auth state');
          
          // Clear authentication state
          AuthMiddleware.handleAuthenticationFailure();
          
          // Return 401 response
          return {
            success: false,
            error: 'Authentication expired. Please login again.',
            statusCode: 401,
          };
        }
      }

      // Handle other auth-related status codes
      if (response.status === 403) {
        console.log('❌ 403 Forbidden - Insufficient permissions');
        
        store.dispatch({
          type: 'ui/SET_ERROR',
          payload: { key: 'AUTH_PERMISSION', error: 'Insufficient permissions' },
        });
      }

      // Call original response handler
      return originalHandleResponse.call(this, response);
    };
  }

  /**
   * Setup automatic token refresh
   */
  private static setupTokenRefresh(): void {
    console.log('🔧 Setting up automatic token refresh...');

    // Check token status every 2 minutes
    setInterval(async () => {
      const { accessToken, expiryTime } = TokenManager.getStoredTokens();
      
      if (accessToken && expiryTime) {
        const timeUntilExpiry = expiryTime - Date.now();
        const refreshThreshold = 10 * 60 * 1000; // 10 minutes before expiry
        
        if (timeUntilExpiry <= refreshThreshold) {
          console.log('⏰ Token nearing expiry, refreshing...');
          await this.refreshTokenIfNeeded();
        }
      }
    }, 2 * 60 * 1000); // Check every 2 minutes
  }

  /**
   * Refresh token if needed (with deduplication)
   */
  private static async refreshTokenIfNeeded(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      console.log('🔄 Token refresh already in progress, waiting...');
      return await this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    
    return result;
  }

  /**
   * Perform actual token refresh
   */
  private static async performTokenRefresh(): Promise<boolean> {
    try {
      console.log('🔄 Performing token refresh...');
      
      const { refreshToken } = TokenManager.getStoredTokens();
      
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      // Make refresh request
      const response = await httpClient.post('/auth/refresh', {
        refreshToken,
      });

      if (response.success && response.data) {
        console.log('✅ Token refresh successful');
        
        // Store new tokens
        TokenManager.storeTokens(
          response.data.tokens,
          response.data.user,
          true // Keep remember me since refresh token exists
        );

        return true;
      } else {
        console.log('❌ Token refresh failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }

  /**
   * Handle authentication failure
   */
  private static handleAuthenticationFailure(): void {
    console.log('🚨 Handling authentication failure...');

    // Clear all auth data
    TokenManager.clearTokens();

    // Update Redux state
    store.dispatch({
      type: 'auth/AUTHENTICATION_FAILED',
    });

    // Store current page for redirect after login
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        sessionStorage.setItem('redirect_after_login', currentPath);
      }
    }

    // Redirect to login (can be customized)
    this.redirectToLogin();
  }

  /**
   * Redirect to login page
   */
  private static redirectToLogin(): void {
    if (typeof window !== 'undefined') {
      // Add delay to allow UI to update
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * STEP 8: Protected Access - Check if user can access protected resource
   */
  static async canAccessProtectedResource(requiredRole?: string): Promise<boolean> {
    console.group('🛡️ Protected Access Check');
    
    try {
      // Step 1: Check if user is authenticated
      if (!AuthFlow.isAuthenticated()) {
        console.log('❌ User not authenticated');
        console.groupEnd();
        return false;
      }

      // Step 2: Verify token with server
      console.log('🔍 Verifying authentication with server...');
      const verification = await AuthFlow.verifyAuthentication();
      
      if (!verification.success) {
        console.log('❌ Server authentication verification failed');
        console.groupEnd();
        return false;
      }

      // Step 3: Check role-based permissions
      if (requiredRole) {
        const hasPermission = AuthFlow.hasPermission(requiredRole);
        if (!hasPermission) {
          console.log('❌ Insufficient permissions for role:', requiredRole);
          console.groupEnd();
          return false;
        }
        console.log('✅ Role permission granted:', requiredRole);
      }

      console.log('✅ Protected access granted');
      console.groupEnd();
      return true;

    } catch (error) {
      console.error('❌ Protected access check failed:', error);
      console.groupEnd();
      return false;
    }
  }

  /**
   * Get authentication status for UI
   */
  static getAuthStatus(): {
    isAuthenticated: boolean;
    user: any | null;
    tokenExpiry: string | null;
    needsRefresh: boolean;
  } {
    const { user, expiryTime } = TokenManager.getStoredTokens();
    const isAuthenticated = AuthFlow.isAuthenticated();
    const needsRefresh = TokenManager.isTokenExpired();

    return {
      isAuthenticated,
      user,
      tokenExpiry: expiryTime ? new Date(expiryTime).toISOString() : null,
      needsRefresh,
    };
  }

  /**
   * Manually trigger token refresh
   */
  static async refreshToken(): Promise<boolean> {
    console.log('🔄 Manual token refresh triggered');
    return await this.refreshTokenIfNeeded();
  }

  /**
   * Check if request needs authentication
   */
  static isProtectedEndpoint(endpoint: string): boolean {
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/health',
    ];

    return !publicEndpoints.some(publicEndpoint => 
      endpoint.startsWith(publicEndpoint)
    );
  }

  /**
   * Get current authentication headers
   */
  static getAuthHeaders(): Record<string, string> {
    const { accessToken } = TokenManager.getStoredTokens();
    
    if (accessToken && !TokenManager.isTokenExpired()) {
      return {
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    return {};
  }
}

// ========================================
// 🔐 AUTH GUARD HOOK (for React components)
// ========================================

export interface UseAuthGuardResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  error: string | null;
  canAccess: (requiredRole?: string) => Promise<boolean>;
  refresh: () => Promise<boolean>;
}

/**
 * Custom hook for authentication guard (would be used in React components)
 */
export function createAuthGuardHook(): UseAuthGuardResult {
  const authStatus = AuthMiddleware.getAuthStatus();
  
  return {
    isAuthenticated: authStatus.isAuthenticated,
    isLoading: false, // Would be managed by React state
    user: authStatus.user,
    error: null, // Would be managed by React state
    canAccess: AuthMiddleware.canAccessProtectedResource,
    refresh: AuthMiddleware.refreshToken,
  };
}

// ========================================
// 🔧 MIDDLEWARE UTILITIES
// ========================================

export const authMiddlewareUtils = {
  /**
   * Initialize all authentication middleware
   */
  initialize: () => {
    AuthMiddleware.initialize();
  },

  /**
   * Get current auth status
   */
  getStatus: () => {
    return AuthMiddleware.getAuthStatus();
  },

  /**
   * Check if endpoint is protected
   */
  isProtected: (endpoint: string) => {
    return AuthMiddleware.isProtectedEndpoint(endpoint);
  },

  /**
   * Get auth headers for manual requests
   */
  getHeaders: () => {
    return AuthMiddleware.getAuthHeaders();
  },

  /**
   * Force token refresh
   */
  refreshToken: () => {
    return AuthMiddleware.refreshToken();
  },

  /**
   * Check access to protected resource
   */
  canAccess: (requiredRole?: string) => {
    return AuthMiddleware.canAccessProtectedResource(requiredRole);
  },
};

// Initialize middleware on import
AuthMiddleware.initialize();

export { AuthMiddleware };
export default AuthMiddleware;
