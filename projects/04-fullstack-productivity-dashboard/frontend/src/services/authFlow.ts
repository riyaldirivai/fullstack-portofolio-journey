/**
 * Authentication Flow Implementation
 * 
 * Complete authentication system following the flow:
 * Login Form → Validate Credentials → Generate JWT Token → Store Token
 *     ↑                                                        ↓
 * Protected Access ← Verify Token ← Middleware Check ← Include in Headers
 */

import { httpClient, ApiResponse } from './httpClient';
import { store } from '../store';

// ========================================
// 🔐 AUTHENTICATION TYPES
// ========================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  message?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ========================================
// 🛡️ TOKEN MANAGEMENT
// ========================================

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'auth_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'auth_refresh_token';
  private static readonly USER_KEY = 'auth_user';
  private static readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry';

  /**
   * Store authentication tokens and user data
   */
  static storeTokens(tokens: AuthTokens, user: AuthUser, rememberMe: boolean = false): void {
    console.log('🔒 Storing authentication tokens', { 
      userId: user.id, 
      expiresIn: tokens.expiresIn,
      rememberMe 
    });

    const storage = rememberMe ? localStorage : sessionStorage;
    const expiryTime = Date.now() + (tokens.expiresIn * 1000);

    // Store tokens and user data
    storage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    storage.setItem(this.USER_KEY, JSON.stringify(user));
    storage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());

    // Set token in HTTP client
    httpClient.setAuthToken(tokens.accessToken);

    // Update Redux store
    store.dispatch({
      type: 'auth/LOGIN_SUCCESS',
      payload: {
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        expiresAt: new Date(expiryTime).toISOString(),
      },
    });
  }

  /**
   * Retrieve stored tokens
   */
  static getStoredTokens(): {
    accessToken: string | null;
    refreshToken: string | null;
    user: AuthUser | null;
    expiryTime: number | null;
  } {
    // Check both localStorage and sessionStorage
    const storages = [localStorage, sessionStorage];
    
    for (const storage of storages) {
      const accessToken = storage.getItem(this.ACCESS_TOKEN_KEY);
      const refreshToken = storage.getItem(this.REFRESH_TOKEN_KEY);
      const userStr = storage.getItem(this.USER_KEY);
      const expiryStr = storage.getItem(this.TOKEN_EXPIRY_KEY);

      if (accessToken && refreshToken && userStr) {
        return {
          accessToken,
          refreshToken,
          user: JSON.parse(userStr),
          expiryTime: expiryStr ? parseInt(expiryStr) : null,
        };
      }
    }

    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      expiryTime: null,
    };
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(): boolean {
    const { expiryTime } = this.getStoredTokens();
    if (!expiryTime) return true;
    
    // Add 5 minute buffer for token refresh
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= (expiryTime - bufferTime);
  }

  /**
   * Clear all authentication data
   */
  static clearTokens(): void {
    console.log('🗑️ Clearing authentication tokens');

    // Clear from both storages
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.TOKEN_EXPIRY_KEY);
    });

    // Clear from HTTP client
    httpClient.setAuthToken(null);

    // Update Redux store
    store.dispatch({
      type: 'auth/LOGOUT',
    });
  }

  /**
   * Initialize tokens on app start
   */
  static initializeAuth(): boolean {
    console.log('🚀 Initializing authentication...');

    const { accessToken, user, expiryTime } = this.getStoredTokens();

    if (!accessToken || !user) {
      console.log('ℹ️ No stored authentication found');
      return false;
    }

    if (this.isTokenExpired()) {
      console.log('⏰ Stored token expired, attempting refresh...');
      AuthFlow.refreshTokens();
      return false;
    }

    // Restore authentication state
    httpClient.setAuthToken(accessToken);
    store.dispatch({
      type: 'auth/RESTORE_SESSION',
      payload: {
        user,
        token: accessToken,
        isAuthenticated: true,
        expiresAt: expiryTime ? new Date(expiryTime).toISOString() : null,
      },
    });

    console.log('✅ Authentication restored', { userId: user.id });
    return true;
  }

  /**
   * Decode JWT token (client-side only for display purposes)
   */
  static decodeToken(token: string): TokenPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Failed to decode token:', error);
      return null;
    }
  }
}

// ========================================
// 🔐 AUTHENTICATION FLOW
// ========================================

export class AuthFlow {
  /**
   * STEP 1: Login Form Submission
   * Validate credentials and authenticate user
   */
  static async login(credentials: LoginCredentials): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    console.group('🔑 Authentication Flow: Login');
    console.log('Step 1: Processing login credentials', { 
      email: credentials.email,
      rememberMe: credentials.rememberMe 
    });

    try {
      // Set loading state
      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: 'AUTH_LOGIN', loading: true },
      });

      // Clear previous errors
      store.dispatch({
        type: 'ui/CLEAR_ERROR',
        payload: 'AUTH_LOGIN',
      });

      // STEP 2: Validate Credentials (API Call)
      console.log('Step 2: Validating credentials with server...');
      const response = await httpClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      // STEP 3: Generate JWT Token (handled by server)
      console.log('Step 3: ✅ Server validated credentials and generated JWT token');
      
      // STEP 4: Store Token
      console.log('Step 4: Storing tokens and user data...');
      TokenManager.storeTokens(
        response.data.tokens,
        response.data.user,
        credentials.rememberMe || false
      );

      console.log('✅ Login flow completed successfully');
      console.groupEnd();

      return {
        success: true,
        user: response.data.user,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login flow failed:', errorMessage);
      
      // Store error in Redux
      store.dispatch({
        type: 'ui/SET_ERROR',
        payload: { key: 'AUTH_LOGIN', error: errorMessage },
      });

      console.groupEnd();
      return {
        success: false,
        error: errorMessage,
      };

    } finally {
      // Clear loading state
      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: 'AUTH_LOGIN', loading: false },
      });
    }
  }

  /**
   * User Registration Flow
   */
  static async register(data: RegisterData): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    console.group('📝 Authentication Flow: Register');
    console.log('Step 1: Processing registration data', { 
      email: data.email,
      name: data.name 
    });

    try {
      // Client-side validation
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (data.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: 'AUTH_REGISTER', loading: true },
      });

      const response = await httpClient.post<AuthResponse>('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Registration failed');
      }

      // Store tokens after successful registration
      TokenManager.storeTokens(
        response.data.tokens,
        response.data.user,
        data.rememberMe || false
      );

      console.log('✅ Registration flow completed successfully');
      console.groupEnd();

      return {
        success: true,
        user: response.data.user,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('❌ Registration flow failed:', errorMessage);
      
      store.dispatch({
        type: 'ui/SET_ERROR',
        payload: { key: 'AUTH_REGISTER', error: errorMessage },
      });

      console.groupEnd();
      return {
        success: false,
        error: errorMessage,
      };

    } finally {
      store.dispatch({
        type: 'ui/SET_LOADING',
        payload: { key: 'AUTH_REGISTER', loading: false },
      });
    }
  }

  /**
   * STEP 5: Include in Headers (Automatic via HTTP Client)
   * STEP 6: Middleware Check (Server-side)
   * STEP 7: Verify Token (Server-side)
   * STEP 8: Protected Access (Frontend)
   */
  static async verifyAuthentication(): Promise<{
    success: boolean;
    user?: AuthUser;
    error?: string;
  }> {
    console.log('🔍 Verifying authentication status...');

    const { accessToken } = TokenManager.getStoredTokens();

    if (!accessToken) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    try {
      // Test protected route to verify token
      const response = await httpClient.get<AuthUser>('/auth/me');

      if (!response.success || !response.data) {
        throw new Error('Token verification failed');
      }

      // Update user data in store
      store.dispatch({
        type: 'auth/UPDATE_USER',
        payload: response.data,
      });

      console.log('✅ Authentication verified');
      return {
        success: true,
        user: response.data,
      };

    } catch (error) {
      console.error('❌ Authentication verification failed:', error);
      
      // Clear invalid tokens
      TokenManager.clearTokens();
      
      return {
        success: false,
        error: 'Authentication expired',
      };
    }
  }

  /**
   * Token Refresh Flow
   */
  static async refreshTokens(): Promise<boolean> {
    console.log('🔄 Refreshing authentication tokens...');

    const { refreshToken } = TokenManager.getStoredTokens();

    if (!refreshToken) {
      console.log('❌ No refresh token available');
      TokenManager.clearTokens();
      return false;
    }

    try {
      const response = await httpClient.post<AuthResponse>('/auth/refresh', {
        refreshToken,
      });

      if (!response.success || !response.data) {
        throw new Error('Token refresh failed');
      }

      // Store new tokens
      TokenManager.storeTokens(
        response.data.tokens,
        response.data.user,
        true // Assume remembered if refresh token exists
      );

      console.log('✅ Tokens refreshed successfully');
      return true;

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      TokenManager.clearTokens();
      return false;
    }
  }

  /**
   * Logout Flow
   */
  static async logout(): Promise<void> {
    console.log('🔓 Logging out user...');

    try {
      // Notify server of logout
      await httpClient.post('/auth/logout');
    } catch (error) {
      console.warn('⚠️ Server logout failed, clearing client tokens anyway', error);
    }

    // Clear all authentication data
    TokenManager.clearTokens();
    
    console.log('✅ Logout completed');
  }

  /**
   * Password Reset Flow
   */
  static async requestPasswordReset(email: string): Promise<boolean> {
    console.log('🔄 Requesting password reset for:', email);

    try {
      const response = await httpClient.post('/auth/forgot-password', { email });
      return response.success;
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      return false;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    console.log('🔧 Resetting password with token...');

    try {
      const response = await httpClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      return response.success;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return false;
    }
  }

  /**
   * Initialize Authentication System
   */
  static initialize(): void {
    console.log('🚀 Initializing Authentication System...');

    // Restore authentication state
    const isAuthenticated = TokenManager.initializeAuth();

    if (isAuthenticated) {
      // Set up automatic token refresh
      this.setupTokenRefresh();
    }

    // Set up authentication interceptors
    this.setupAuthInterceptors();

    console.log('✅ Authentication system initialized');
  }

  /**
   * Setup automatic token refresh
   */
  private static setupTokenRefresh(): void {
    // Check token expiry every minute
    setInterval(async () => {
      if (TokenManager.isTokenExpired()) {
        console.log('⏰ Token expired, attempting refresh...');
        const refreshed = await this.refreshTokens();
        
        if (!refreshed) {
          console.log('❌ Token refresh failed, redirecting to login...');
          // Redirect to login page
          window.location.href = '/login';
        }
      }
    }, 60000); // 1 minute
  }

  /**
   * Setup authentication interceptors
   */
  private static setupAuthInterceptors(): void {
    // Handle 401 responses globally
    const originalRequest = httpClient.request;
    
    // This would need to be implemented in the HttpClient class
    // to handle automatic token refresh on 401 responses
  }

  /**
   * Check if user has specific role/permission
   */
  static hasPermission(requiredRole: string): boolean {
    const { user } = TokenManager.getStoredTokens();
    return user?.role === requiredRole || user?.role === 'admin';
  }

  /**
   * Get current user
   */
  static getCurrentUser(): AuthUser | null {
    return TokenManager.getStoredTokens().user;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const { accessToken } = TokenManager.getStoredTokens();
    return !!accessToken && !TokenManager.isTokenExpired();
  }
}

// ========================================
// 🛡️ PROTECTED ROUTE GUARD
// ========================================

export class AuthGuard {
  /**
   * Check if user can access protected route
   */
  static async canAccess(requiredRole?: string): Promise<boolean> {
    console.log('🛡️ Checking protected route access...', { requiredRole });

    if (!AuthFlow.isAuthenticated()) {
      console.log('❌ User not authenticated');
      return false;
    }

    // Verify with server
    const verification = await AuthFlow.verifyAuthentication();
    if (!verification.success) {
      console.log('❌ Server authentication verification failed');
      return false;
    }

    // Check role if specified
    if (requiredRole && !AuthFlow.hasPermission(requiredRole)) {
      console.log('❌ User lacks required permission:', requiredRole);
      return false;
    }

    console.log('✅ Protected route access granted');
    return true;
  }

  /**
   * Redirect to login if not authenticated
   */
  static requireAuth(requiredRole?: string): Promise<boolean> {
    return this.canAccess(requiredRole).then(canAccess => {
      if (!canAccess) {
        // Store intended route for redirect after login
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = '/login';
        return false;
      }
      return true;
    });
  }
}

// ========================================
// 🔐 AUTH HOOKS & UTILITIES
// ========================================

export const authUtils = {
  // Get loading state
  isLoading: (action: string) => {
    const state = store.getState();
    return Boolean((state.ui.loading as any)[action]);
  },

  // Get error message
  getError: (action: string) => {
    const state = store.getState();
    return (state.ui.errors as any)[action] || null;
  },

  // Clear error
  clearError: (action: string) => {
    store.dispatch({
      type: 'ui/CLEAR_ERROR',
      payload: action,
    });
  },

  // Format error message
  formatAuthError: (error: string) => {
    const errorMap: Record<string, string> = {
      'Invalid credentials': 'Email atau password salah',
      'User not found': 'Akun tidak ditemukan',
      'Email already exists': 'Email sudah terdaftar',
      'Token expired': 'Sesi telah berakhir, silakan login kembali',
      'Access denied': 'Akses ditolak',
    };
    return errorMap[error] || error;
  },

  // Check password strength
  checkPasswordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('Minimal 8 karakter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('Minimal 1 huruf kecil');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('Minimal 1 huruf besar');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('Minimal 1 angka');

    if (/[^a-zA-Z0-9]/.test(password)) score++;
    else feedback.push('Minimal 1 karakter khusus');

    return { score, feedback };
  },

  // Validate email format
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};

// Initialize authentication system on import
AuthFlow.initialize();

export { TokenManager, AuthFlow, AuthGuard };
export default AuthFlow;
