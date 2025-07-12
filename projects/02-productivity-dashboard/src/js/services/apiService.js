/**
 * ===========================================
 * API SERVICE LAYER - REAL BACKEND INTEGRATION
 * Converts from mock server to real backend API
 * Author: riyaldirivai
 * Date: 2025-07-11
 * ===========================================
 */

// 🔧 ENVIRONMENT CONFIGURATION
// Support for multiple environments (development, production)
const ENV_CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3000',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  production: {
    API_BASE_URL: 'https://your-production-api.com',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    TIMEOUT: 15000,
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY: 2000
  }
};

// Get current environment (default to development)
const CURRENT_ENV = process.env.NODE_ENV || 'development';
const CONFIG = ENV_CONFIG[CURRENT_ENV];

// Construct full API URL
const API_URL = `${CONFIG.API_BASE_URL}${CONFIG.API_PREFIX}/${CONFIG.API_VERSION}`;

/**
 * 🔐 TOKEN MANAGEMENT
 * Handles JWT token storage and retrieval
 */
class TokenManager {
  static TOKEN_KEY = 'productivity_auth_token';
  static REFRESH_TOKEN_KEY = 'productivity_refresh_token';
  static USER_KEY = 'productivity_user_data';

  // Get stored auth token
  static getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored refresh token
  static getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Store auth tokens
  static setTokens(authToken, refreshToken = null) {
    localStorage.setItem(this.TOKEN_KEY, authToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  // Remove all tokens (logout)
  static clearTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Store user data
  static setUser(userData) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }

  // Get stored user data
  static getUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return !!this.getToken();
  }
}

/**
 * 🔄 HTTP CLIENT WITH INTERCEPTORS
 * Enhanced fetch wrapper with authentication, retry, and error handling
 */
class HttpClient {
  constructor() {
    this.baseURL = API_URL;
    this.timeout = CONFIG.TIMEOUT;
    this.retryAttempts = CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = CONFIG.RETRY_DELAY;
  }

  /**
   * Create request headers with authentication
   */
  _createHeaders(includeAuth = true, customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders
    };

    // Add authentication header if token exists and requested
    if (includeAuth) {
      const token = TokenManager.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle response and check for errors
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Token expired or invalid, try to refresh
        const refreshed = await this._refreshToken();
        if (!refreshed) {
          // Refresh failed, logout user
          TokenManager.clearTokens();
          this._redirectToLogin();
        }
        throw new ApiError('Authentication failed', response.status, data);
      }
      
      throw new ApiError(
        data.message || `HTTP Error ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  }

  /**
   * Retry logic with exponential backoff
   */
  async _retryRequest(requestFn, attempts = this.retryAttempts) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempts > 0 && this._shouldRetry(error)) {
        console.warn(`Request failed, retrying... (${this.retryAttempts - attempts + 1}/${this.retryAttempts})`);
        await this._delay(this.retryDelay * (this.retryAttempts - attempts + 1));
        return this._retryRequest(requestFn, attempts - 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  _shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return !error.status || error.status >= 500;
  }

  /**
   * Delay helper for retry logic
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Try to refresh authentication token
   */
  async _refreshToken() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: this._createHeaders(false),
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        TokenManager.setTokens(data.data.tokens.authToken, data.data.tokens.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    return false;
  }

  /**
   * Redirect to login page
   */
  _redirectToLogin() {
    // For now, just clear tokens and reload page
    // In a real app, you might redirect to a login route
    console.warn('Authentication required. Please login again.');
    window.location.reload();
  }

  /**
   * Make HTTP request with timeout and retry
   */
  async _makeRequest(method, endpoint, data = null, options = {}) {
    const { includeAuth = true, customHeaders = {} } = options;

    const requestFn = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const fetchOptions = {
          method,
          headers: this._createHeaders(includeAuth, customHeaders),
          signal: controller.signal
        };

        if (data && method !== 'GET') {
          fetchOptions.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);
        clearTimeout(timeoutId);
        
        return await this._handleResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw error;
      }
    };

    return this._retryRequest(requestFn);
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this._makeRequest('GET', endpoint, null, options);
  }

  async post(endpoint, data, options = {}) {
    return this._makeRequest('POST', endpoint, data, options);
  }

  async put(endpoint, data, options = {}) {
    return this._makeRequest('PUT', endpoint, data, options);
  }

  async delete(endpoint, options = {}) {
    return this._makeRequest('DELETE', endpoint, null, options);
  }
}

/**
 * 🚫 CUSTOM ERROR CLASS
 * For better error handling and debugging
 */
class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * 🏗️ API SERVICE CLASSES
 * Organized by feature domain - single source of truth for all API calls
 */

// Authentication Service
class AuthService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  // Register new user
  async register(userData) {
    try {
      const response = await this.http.post('/auth/register', userData, { includeAuth: false });
      
      // Store tokens and user data on successful registration
      if (response.success && response.data.tokens) {
        TokenManager.setTokens(response.data.tokens.authToken, response.data.tokens.refreshToken);
        TokenManager.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await this.http.post('/auth/login', credentials, { includeAuth: false });
      
      // Store tokens and user data on successful login
      if (response.success && response.data.tokens) {
        TokenManager.setTokens(response.data.tokens.authToken, response.data.tokens.refreshToken);
        TokenManager.setUser(response.data.user);
      }
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await this.http.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens();
    }
  }

  // Get current user profile
  async getProfile() {
    return this.http.get('/auth/profile');
  }

  // Update user profile
  async updateProfile(updateData) {
    return this.http.put('/auth/profile', updateData);
  }

  // Change password
  async changePassword(passwordData) {
    return this.http.put('/auth/change-password', passwordData);
  }

  // Get user statistics
  async getStats() {
    return this.http.get('/auth/stats');
  }
}

// Goals Service
class GoalsService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  // Get all goals with pagination and filters
  async getGoals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/goals?${queryString}` : '/goals';
    return this.http.get(endpoint);
  }

  // Create new goal
  async createGoal(goalData) {
    return this.http.post('/goals', goalData);
  }

  // Get specific goal by ID
  async getGoal(goalId) {
    return this.http.get(`/goals/${goalId}`);
  }

  // Update goal
  async updateGoal(goalId, updateData) {
    return this.http.put(`/goals/${goalId}`, updateData);
  }

  // Delete goal
  async deleteGoal(goalId) {
    return this.http.delete(`/goals/${goalId}`);
  }

  // Update goal progress
  async updateProgress(goalId, progressData) {
    return this.http.post(`/goals/${goalId}/progress`, progressData);
  }

  // Get goal statistics
  async getStatistics() {
    return this.http.get('/goals/statistics');
  }
}

// Timer Sessions Service
class TimerService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  // Start new timer session
  async startTimer(timerData) {
    return this.http.post('/timer-sessions/start', timerData);
  }

  // Get active timer
  async getActiveTimer() {
    return this.http.get('/timer-sessions/active');
  }

  // Pause timer
  async pauseTimer() {
    return this.http.put('/timer-sessions/pause');
  }

  // Resume timer
  async resumeTimer() {
    return this.http.put('/timer-sessions/resume');
  }

  // Stop timer
  async stopTimer(stopData = {}) {
    return this.http.post('/timer-sessions/stop', stopData);
  }

  // Get timer history
  async getHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/timer-sessions/history?${queryString}` : '/timer-sessions/history';
    return this.http.get(endpoint);
  }

  // Get timer statistics
  async getStats() {
    return this.http.get('/timer-sessions/stats');
  }
}

// Dashboard Service
class DashboardService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  // Get dashboard analytics
  async getAnalytics() {
    return this.http.get('/dashboard/analytics');
  }

  // Get recent activities
  async getRecentActivities(limit = 10) {
    return this.http.get(`/dashboard/recent?limit=${limit}`);
  }

  // Get productivity metrics
  async getProductivityMetrics(days = 7) {
    return this.http.get(`/dashboard/productivity?days=${days}`);
  }

  // Get goals summary
  async getGoalsSummary() {
    return this.http.get('/dashboard/goals-summary');
  }

  // Get timer statistics
  async getTimerStats() {
    return this.http.get('/dashboard/timer-stats');
  }
}

/**
 * 🎯 MAIN API SERVICE SINGLETON
 * Single point of access for all API operations
 */
class ApiService {
  constructor() {
    this.httpClient = new HttpClient();
    
    // Initialize service modules
    this.auth = new AuthService(this.httpClient);
    this.goals = new GoalsService(this.httpClient);
    this.timer = new TimerService(this.httpClient);
    this.dashboard = new DashboardService(this.httpClient);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw new ApiError('Backend server is not responding', 503);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return TokenManager.isAuthenticated();
  }

  // Get current user data
  getCurrentUser() {
    return TokenManager.getUser();
  }

  // Logout (clear local data)
  logout() {
    return this.auth.logout();
  }
}

// Create and export singleton instance
const apiService = new ApiService();

// Export classes and utilities for advanced usage
export {
  ApiService,
  TokenManager,
  ApiError,
  ENV_CONFIG,
  apiService as default
};

// For browsers without module support
if (typeof window !== 'undefined') {
  window.ApiService = apiService;
  window.TokenManager = TokenManager;
  window.ApiError = ApiError;
}
