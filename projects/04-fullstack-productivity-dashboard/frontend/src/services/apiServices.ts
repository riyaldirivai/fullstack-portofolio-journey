/**
 * API Services Layer
 * 
 * High-level API service functions that handle the complete request/response flow:
 * Component → Service → HttpClient → Express Route → MongoDB → Response → Redux Store
 */

import { httpClient } from './httpClient';
import type { ApiResponse } from './httpClient';

// Type definitions matching backend models
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'health' | 'learning' | 'financial';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  progress: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  subGoals?: SubGoal[];
  tags?: string[];
}

export interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface TimerSession {
  id: string;
  goalId?: string;
  type: 'pomodoro' | 'shortBreak' | 'longBreak' | 'custom';
  duration: number;
  remainingTime?: number;
  startTime: string;
  endTime?: string;
  status: 'idle' | 'running' | 'paused' | 'completed';
  notes?: string;
  userId: string;
}

export interface AnalyticsData {
  overview: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    completionRate: number;
    totalFocusTime: number;
    averageSessionTime: number;
  };
  trends: {
    daily: Array<{ date: string; goals: number; time: number }>;
    weekly: Array<{ week: string; goals: number; time: number }>;
    monthly: Array<{ month: string; goals: number; time: number }>;
  };
  categories: Array<{
    category: string;
    count: number;
    completionRate: number;
    totalTime: number;
  }>;
  productivity: {
    mostProductiveDay: string;
    mostProductiveHour: number;
    streakStats: {
      current: number;
      longest: number;
      thisMonth: number;
    };
  };
}

export interface DashboardSummary {
  user: User;
  goalStats: {
    total: number;
    completed: number;
    active: number;
    overdue: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'goal_created' | 'goal_completed' | 'timer_completed';
    title: string;
    description: string;
    createdAt: string;
  }>;
  upcomingDeadlines: Goal[];
  todayFocusTime: number;
  currentStreak: number;
}

/**
 * Authentication Service
 * Handles user authentication and profile management
 */
export class AuthService {
  static async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('🔐 AuthService.login:', { email });
    
    const response = await httpClient.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      httpClient.setAuthToken(response.data.token);
      
      // Store token for persistence
      localStorage.setItem('authToken', response.data.token);
      
      console.log('✅ Login successful:', { userId: response.data.user.id });
    }

    return response;
  }

  static async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('📝 AuthService.register:', { email: userData.email, name: userData.name });
    
    const response = await httpClient.post<{ user: User; token: string }>('/auth/register', userData);

    if (response.success && response.data?.token) {
      httpClient.setAuthToken(response.data.token);
      localStorage.setItem('authToken', response.data.token);
      
      console.log('✅ Registration successful:', { userId: response.data.user.id });
    }

    return response;
  }

  static async logout(): Promise<ApiResponse<void>> {
    console.log('🔓 AuthService.logout');
    
    const response = await httpClient.post<void>('/auth/logout');
    
    // Clear auth token regardless of response
    httpClient.setAuthToken(null);
    localStorage.removeItem('authToken');
    
    console.log('✅ Logout completed');
    return response;
  }

  static async getProfile(): Promise<ApiResponse<User>> {
    console.log('👤 AuthService.getProfile');
    return httpClient.get<User>('/auth/profile');
  }

  static async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    console.log('✏️ AuthService.updateProfile:', updates);
    return httpClient.put<User>('/auth/profile', updates);
  }

  static async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    console.log('🔑 AuthService.changePassword');
    return httpClient.post<void>('/auth/change-password', {
      oldPassword,
      newPassword,
    });
  }

  static async forgotPassword(email: string): Promise<ApiResponse<void>> {
    console.log('🔄 AuthService.forgotPassword:', { email });
    return httpClient.post<void>('/auth/forgot-password', { email });
  }

  static async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    console.log('🔧 AuthService.resetPassword');
    return httpClient.post<void>('/auth/reset-password', {
      token,
      newPassword,
    });
  }

  static async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    console.log('🔄 AuthService.refreshToken');
    const response = await httpClient.post<{ token: string }>('/auth/refresh');
    
    if (response.success && response.data?.token) {
      httpClient.setAuthToken(response.data.token);
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response;
  }

  static initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      httpClient.setAuthToken(token);
      console.log('🔐 Auth token restored from localStorage');
    }
  }
}

/**
 * Goals Service
 * Handles goal CRUD operations and management
 */
export class GoalsService {
  static async getAll(params?: {
    category?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<Goal[]>> {
    console.log('📋 GoalsService.getAll:', params);
    
    const query = params ? httpClient.buildQuery(params) : '';
    const endpoint = query ? `/goals?${query}` : '/goals';
    
    return httpClient.get<Goal[]>(endpoint);
  }

  static async getById(id: string): Promise<ApiResponse<Goal>> {
    console.log('📋 GoalsService.getById:', { id });
    return httpClient.get<Goal>(`/goals/${id}`);
  }

  static async create(goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<ApiResponse<Goal>> {
    console.log('➕ GoalsService.create:', { title: goalData.title, category: goalData.category });
    return httpClient.post<Goal>('/goals', goalData);
  }

  static async update(id: string, updates: Partial<Goal>): Promise<ApiResponse<Goal>> {
    console.log('✏️ GoalsService.update:', { id, updates });
    return httpClient.put<Goal>(`/goals/${id}`, updates);
  }

  static async delete(id: string): Promise<ApiResponse<void>> {
    console.log('🗑️ GoalsService.delete:', { id });
    return httpClient.delete<void>(`/goals/${id}`);
  }

  static async updateProgress(id: string, progress: number): Promise<ApiResponse<Goal>> {
    console.log('📊 GoalsService.updateProgress:', { id, progress });
    return httpClient.patch<Goal>(`/goals/${id}/progress`, { progress });
  }

  static async addSubGoal(goalId: string, subGoal: Omit<SubGoal, 'id'>): Promise<ApiResponse<Goal>> {
    console.log('➕ GoalsService.addSubGoal:', { goalId, title: subGoal.title });
    return httpClient.post<Goal>(`/goals/${goalId}/subgoals`, subGoal);
  }

  static async updateSubGoal(
    goalId: string, 
    subGoalId: string, 
    updates: Partial<SubGoal>
  ): Promise<ApiResponse<Goal>> {
    console.log('✏️ GoalsService.updateSubGoal:', { goalId, subGoalId, updates });
    return httpClient.put<Goal>(`/goals/${goalId}/subgoals/${subGoalId}`, updates);
  }

  static async deleteSubGoal(goalId: string, subGoalId: string): Promise<ApiResponse<Goal>> {
    console.log('🗑️ GoalsService.deleteSubGoal:', { goalId, subGoalId });
    return httpClient.delete<Goal>(`/goals/${goalId}/subgoals/${subGoalId}`);
  }
}

/**
 * Timer Service
 * Handles timer sessions and productivity tracking
 */
export class TimerService {
  static async getSessions(params?: {
    goalId?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<TimerSession[]>> {
    console.log('⏱️ TimerService.getSessions:', params);
    
    const query = params ? httpClient.buildQuery(params) : '';
    const endpoint = query ? `/timer/sessions?${query}` : '/timer/sessions';
    
    return httpClient.get<TimerSession[]>(endpoint);
  }

  static async createSession(sessionData: Omit<TimerSession, 'id' | 'userId'>): Promise<ApiResponse<TimerSession>> {
    console.log('▶️ TimerService.createSession:', { type: sessionData.type, duration: sessionData.duration });
    return httpClient.post<TimerSession>('/timer/sessions', sessionData);
  }

  static async updateSession(id: string, updates: Partial<TimerSession>): Promise<ApiResponse<TimerSession>> {
    console.log('✏️ TimerService.updateSession:', { id, updates });
    return httpClient.put<TimerSession>(`/timer/sessions/${id}`, updates);
  }

  static async deleteSession(id: string): Promise<ApiResponse<void>> {
    console.log('🗑️ TimerService.deleteSession:', { id });
    return httpClient.delete<void>(`/timer/sessions/${id}`);
  }

  static async getStatistics(period?: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<{
    totalSessions: number;
    totalFocusTime: number;
    averageSessionTime: number;
    streakDays: number;
    completionRate: number;
  }>> {
    console.log('📊 TimerService.getStatistics:', { period });
    
    const query = period ? `?period=${period}` : '';
    return httpClient.get(`/timer/statistics${query}`);
  }
}

/**
 * Analytics Service
 * Handles productivity analytics and reporting
 */
export class AnalyticsService {
  static async getOverview(params?: {
    from?: string;
    to?: string;
    goalIds?: string[];
  }): Promise<ApiResponse<AnalyticsData>> {
    console.log('📈 AnalyticsService.getOverview:', params);
    
    const query = params ? httpClient.buildQuery(params) : '';
    const endpoint = query ? `/analytics/overview?${query}` : '/analytics/overview';
    
    return httpClient.get<AnalyticsData>(endpoint);
  }

  static async getTrends(
    period: 'daily' | 'weekly' | 'monthly',
    params?: { from?: string; to?: string }
  ): Promise<ApiResponse<AnalyticsData['trends']>> {
    console.log('📊 AnalyticsService.getTrends:', { period, params });
    
    const queryParams = { period, ...params };
    const query = httpClient.buildQuery(queryParams);
    
    return httpClient.get<AnalyticsData['trends']>(`/analytics/trends?${query}`);
  }

  static async getProductivityStats(): Promise<ApiResponse<AnalyticsData['productivity']>> {
    console.log('⚡ AnalyticsService.getProductivityStats');
    return httpClient.get<AnalyticsData['productivity']>('/analytics/productivity');
  }

  static async exportData(
    format: 'csv' | 'json' | 'pdf',
    params?: { from?: string; to?: string }
  ): Promise<ApiResponse<{ downloadUrl: string }>> {
    console.log('💾 AnalyticsService.exportData:', { format, params });
    
    const queryParams = { format, ...params };
    const query = httpClient.buildQuery(queryParams);
    
    return httpClient.get<{ downloadUrl: string }>(`/analytics/export?${query}`);
  }
}

/**
 * Dashboard Service
 * Handles dashboard data aggregation
 */
export class DashboardService {
  static async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    console.log('🏠 DashboardService.getSummary');
    return httpClient.get<DashboardSummary>('/dashboard/summary');
  }

  static async getRecentActivity(limit?: number): Promise<ApiResponse<DashboardSummary['recentActivity']>> {
    console.log('📝 DashboardService.getRecentActivity:', { limit });
    
    const query = limit ? `?limit=${limit}` : '';
    return httpClient.get<DashboardSummary['recentActivity']>(`/dashboard/activity${query}`);
  }

  static async getUpcomingDeadlines(days?: number): Promise<ApiResponse<Goal[]>> {
    console.log('⏰ DashboardService.getUpcomingDeadlines:', { days });
    
    const query = days ? `?days=${days}` : '';
    return httpClient.get<Goal[]>(`/dashboard/deadlines${query}`);
  }
}

/**
 * Settings Service
 * Handles user settings and preferences
 */
export class SettingsService {
  static async get(): Promise<ApiResponse<any>> {
    console.log('⚙️ SettingsService.get');
    return httpClient.get('/settings');
  }

  static async update(settings: any): Promise<ApiResponse<any>> {
    console.log('✏️ SettingsService.update:', settings);
    return httpClient.put('/settings', settings);
  }

  static async reset(): Promise<ApiResponse<void>> {
    console.log('🔄 SettingsService.reset');
    return httpClient.post<void>('/settings/reset');
  }

  static async export(): Promise<ApiResponse<{ downloadUrl: string }>> {
    console.log('💾 SettingsService.export');
    return httpClient.get<{ downloadUrl: string }>('/settings/export');
  }

  static async import(file: File): Promise<ApiResponse<void>> {
    console.log('📁 SettingsService.import');
    return httpClient.uploadFile<void>('/settings/import', file);
  }
}

/**
 * API Services Collection
 * Central export for all API services
 */
export const apiServices = {
  auth: AuthService,
  goals: GoalsService,
  timer: TimerService,
  analytics: AnalyticsService,
  dashboard: DashboardService,
  settings: SettingsService,
  
  // Utility methods
  healthCheck: () => httpClient.healthCheck(),
  setAuthToken: (token: string | null) => httpClient.setAuthToken(token),
  
  // Initialize services
  initialize: () => {
    AuthService.initializeAuth();
    console.log('🚀 API Services initialized');
  },
};

// Auto-initialize on import
apiServices.initialize();

export default apiServices;
