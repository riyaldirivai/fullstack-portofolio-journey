/**
 * API Middleware
 * 
 * Handles API communication and async actions for the store.
 * Provides centralized error handling and loading states.
 */

import type { Action } from '../store';

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

const defaultConfig: ApiConfig = {
  baseUrl: 'http://localhost:3001/api',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

class ApiClient {
  private config: ApiConfig;
  private authToken: string | null = null;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 && retryCount < this.config.retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
          return this.request(endpoint, options, retryCount + 1);
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (retryCount < this.config.retries && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay * Math.pow(2, retryCount));
        return this.request(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  private isRetryableError(error: any): boolean {
    return (
      error instanceof TypeError || // Network errors
      (error instanceof Error && error.message.includes('fetch'))
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, { method: 'GET' });
    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const response = await this.request(endpoint, { method: 'DELETE' });
    return response.status === 204 ? null : response.json();
  }

  async patch(endpoint: string, data: any): Promise<any> {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

// Create API client instance
const apiClient = new ApiClient();

// API middleware function
export const apiMiddleware = (action: Action, state: any) => {
  // Update auth token if it changes
  if (action.type === 'auth/loginSuccess' && action.payload?.token) {
    apiClient.setAuthToken(action.payload.token);
  }

  if (action.type === 'auth/logout') {
    apiClient.setAuthToken(null);
  }

  // Log API-related actions
  if (action.type.includes('load') || action.type.includes('create') || action.type.includes('update')) {
    console.log(`[API] ${action.type}`, action.payload);
  }
};

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    
    register: (userData: { email: string; password: string; name: string }) =>
      apiClient.post('/auth/register', userData),
    
    logout: () =>
      apiClient.post('/auth/logout', {}),
    
    refreshToken: () =>
      apiClient.post('/auth/refresh', {}),
    
    getProfile: () =>
      apiClient.get('/auth/profile'),
    
    updateProfile: (updates: any) =>
      apiClient.put('/auth/profile', updates),
    
    changePassword: (oldPassword: string, newPassword: string) =>
      apiClient.post('/auth/change-password', { oldPassword, newPassword }),
    
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }),
    
    resetPassword: (token: string, newPassword: string) =>
      apiClient.post('/auth/reset-password', { token, newPassword }),
  },

  // Goals endpoints
  goals: {
    getAll: () =>
      apiClient.get('/goals'),
    
    getById: (id: string) =>
      apiClient.get(`/goals/${id}`),
    
    create: (goalData: any) =>
      apiClient.post('/goals', goalData),
    
    update: (id: string, updates: any) =>
      apiClient.put(`/goals/${id}`, updates),
    
    delete: (id: string) =>
      apiClient.delete(`/goals/${id}`),
    
    updateProgress: (id: string, progress: number) =>
      apiClient.patch(`/goals/${id}/progress`, { progress }),
    
    addSubGoal: (goalId: string, subGoal: any) =>
      apiClient.post(`/goals/${goalId}/subgoals`, subGoal),
    
    updateSubGoal: (goalId: string, subGoalId: string, updates: any) =>
      apiClient.put(`/goals/${goalId}/subgoals/${subGoalId}`, updates),
    
    deleteSubGoal: (goalId: string, subGoalId: string) =>
      apiClient.delete(`/goals/${goalId}/subgoals/${subGoalId}`),
  },

  // Timer endpoints
  timer: {
    getSessions: (params?: { goalId?: string; date?: string }) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return apiClient.get(`/timer/sessions${query}`);
    },
    
    createSession: (sessionData: any) =>
      apiClient.post('/timer/sessions', sessionData),
    
    updateSession: (id: string, updates: any) =>
      apiClient.put(`/timer/sessions/${id}`, updates),
    
    deleteSession: (id: string) =>
      apiClient.delete(`/timer/sessions/${id}`),
    
    getStatistics: (period?: string) => {
      const query = period ? `?period=${period}` : '';
      return apiClient.get(`/timer/statistics${query}`);
    },
  },

  // Analytics endpoints
  analytics: {
    getOverview: (dateRange?: { from: string; to: string }) => {
      const query = dateRange ? `?from=${dateRange.from}&to=${dateRange.to}` : '';
      return apiClient.get(`/analytics/overview${query}`);
    },
    
    getTrends: (period: 'daily' | 'weekly' | 'monthly', dateRange?: { from: string; to: string }) => {
      const params = new URLSearchParams({ period });
      if (dateRange) {
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
      }
      return apiClient.get(`/analytics/trends?${params.toString()}`);
    },
    
    getProductivityStats: () =>
      apiClient.get('/analytics/productivity'),
    
    exportData: (format: 'csv' | 'json' | 'pdf', dateRange?: { from: string; to: string }) => {
      const params = new URLSearchParams({ format });
      if (dateRange) {
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
      }
      return apiClient.get(`/analytics/export?${params.toString()}`);
    },
  },

  // Settings endpoints
  settings: {
    get: () =>
      apiClient.get('/settings'),
    
    update: (settings: any) =>
      apiClient.put('/settings', settings),
    
    reset: () =>
      apiClient.post('/settings/reset', {}),
    
    export: () =>
      apiClient.get('/settings/export'),
    
    import: (settingsData: any) =>
      apiClient.post('/settings/import', settingsData),
  },

  // Dashboard endpoints
  dashboard: {
    getSummary: () =>
      apiClient.get('/dashboard/summary'),
    
    getRecentActivity: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return apiClient.get(`/dashboard/activity${query}`);
    },
    
    getUpcomingDeadlines: (days?: number) => {
      const query = days ? `?days=${days}` : '';
      return apiClient.get(`/dashboard/deadlines${query}`);
    },
  },
};

// Export API client for direct use
export { apiClient };
export default apiService;
