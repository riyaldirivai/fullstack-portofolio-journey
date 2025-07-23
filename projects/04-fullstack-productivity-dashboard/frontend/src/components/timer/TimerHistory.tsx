/**
 * TimerHistory Component
 * 
 * Comprehensive timer session history with analytics, filtering,
 * and detailed session tracking
 */

import { TimerSession, TimerStats } from './PomodoroTimer';

interface TimerHistoryProps {
  sessions: TimerSession[];
  onDeleteSession?: (sessionId: string) => void;
  onExportData?: (format: 'csv' | 'json') => void;
  onSessionSelect?: (session: TimerSession) => void;
  className?: string;
  showAnalytics?: boolean;
  showFilters?: boolean;
}

interface SessionFilter {
  dateRange: 'today' | 'week' | 'month' | 'all' | 'custom';
  sessionType: 'all' | 'work' | 'shortBreak' | 'longBreak';
  status: 'all' | 'completed' | 'stopped' | 'running';
  goalId?: string;
  customStartDate?: string;
  customEndDate?: string;
}

interface AnalyticsData {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number;
  completionRate: number;
  todaysSessions: number;
  weeklyGoal: number;
  currentStreak: number;
  longestStreak: number;
  productivityScore: number;
}

interface ChartData {
  labels: string[];
  sessions: number[];
  focusTime: number[];
}

/**
 * TimerHistory - Advanced session history and analytics
 */
class TimerHistory {
  private props: TimerHistoryProps;
  private sessions: TimerSession[];
  private filters: SessionFilter;
  private selectedSession: TimerSession | null;
  private viewMode: 'list' | 'calendar' | 'chart';
  private sortBy: 'date' | 'duration' | 'type' | 'status';
  private sortOrder: 'asc' | 'desc';

  constructor(props: TimerHistoryProps) {
    this.props = {
      className: '',
      showAnalytics: true,
      showFilters: true,
      ...props
    };
    
    this.sessions = [...props.sessions];
    this.selectedSession = null;
    this.viewMode = 'list';
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    
    this.filters = {
      dateRange: 'week',
      sessionType: 'all',
      status: 'all'
    };
  }

  private filterSessions(): TimerSession[] {
    let filtered = [...this.sessions];

    // Date filter
    const now = new Date();
    let startDate: Date;
    
    switch (this.filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (this.filters.customStartDate) {
          startDate = new Date(this.filters.customStartDate);
          if (this.filters.customEndDate) {
            const endDate = new Date(this.filters.customEndDate);
            filtered = filtered.filter(session => {
              const sessionDate = new Date(session.startTime || session.endTime || '');
              return sessionDate >= startDate && sessionDate <= endDate;
            });
          }
        }
        break;
      case 'all':
      default:
        return filtered;
    }

    if (this.filters.dateRange !== 'custom' && this.filters.dateRange !== 'all') {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.startTime || session.endTime || '');
        return sessionDate >= startDate;
      });
    }

    // Session type filter
    if (this.filters.sessionType !== 'all') {
      filtered = filtered.filter(session => session.type === this.filters.sessionType);
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(session => session.status === this.filters.status);
    }

    // Goal filter
    if (this.filters.goalId) {
      filtered = filtered.filter(session => session.goalId === this.filters.goalId);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          const dateA = new Date(a.startTime || a.endTime || '').getTime();
          const dateB = new Date(b.startTime || b.endTime || '').getTime();
          comparison = dateA - dateB;
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  private calculateAnalytics(): AnalyticsData {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalSessions = this.sessions.length;
    const completedSessions = this.sessions.filter(s => s.status === 'completed').length;
    const totalFocusTime = this.sessions
      .filter(s => s.type === 'work' && s.status === 'completed')
      .reduce((sum, s) => sum + (s.duration / 60), 0);

    const todaysSessions = this.sessions.filter(s => {
      const sessionDate = new Date(s.startTime || s.endTime || '');
      return sessionDate >= today;
    }).length;

    const averageSessionLength = completedSessions > 0 ? totalFocusTime / completedSessions : 0;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate streaks
    const workSessions = this.sessions
      .filter(s => s.type === 'work' && s.status === 'completed')
      .sort((a, b) => new Date(b.startTime || '').getTime() - new Date(a.startTime || '').getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Group sessions by day to calculate streaks
    const sessionsByDay = new Map<string, number>();
    workSessions.forEach(session => {
      const dateKey = new Date(session.startTime || '').toDateString();
      sessionsByDay.set(dateKey, (sessionsByDay.get(dateKey) || 0) + 1);
    });

    const sortedDays = Array.from(sessionsByDay.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate current streak (consecutive days from today)
    for (let i = 0; i < sortedDays.length; i++) {
      const dayDate = new Date(sortedDays[i]);
      const expectedDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      
      if (dayDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let consecutiveDays = 0;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const currentDay = new Date(sortedDays[i]);
      const nextDay = new Date(sortedDays[i + 1]);
      const dayDiff = (currentDay.getTime() - nextDay.getTime()) / (24 * 60 * 60 * 1000);
      
      if (dayDiff === 1) {
        consecutiveDays++;
      } else {
        longestStreak = Math.max(longestStreak, consecutiveDays + 1);
        consecutiveDays = 0;
      }
    }
    longestStreak = Math.max(longestStreak, consecutiveDays + 1);

    // Calculate productivity score (0-100)
    const weeklyTarget = 25; // Target hours per week
    const weeklyFocusTime = this.sessions
      .filter(s => {
        const sessionDate = new Date(s.startTime || s.endTime || '');
        return s.type === 'work' && s.status === 'completed' && sessionDate >= weekAgo;
      })
      .reduce((sum, s) => sum + (s.duration / 60), 0) / 60; // Convert to hours

    const productivityScore = Math.min((weeklyFocusTime / weeklyTarget) * 100, 100);

    return {
      totalSessions,
      completedSessions,
      totalFocusTime,
      averageSessionLength,
      completionRate,
      todaysSessions,
      weeklyGoal: weeklyTarget,
      currentStreak,
      longestStreak,
      productivityScore
    };
  }

  private generateChartData(): ChartData {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    const sessionsByDay = new Map<string, number>();
    const focusTimeByDay = new Map<string, number>();

    this.sessions.forEach(session => {
      const dateKey = new Date(session.startTime || session.endTime || '').toDateString();
      if (last7Days.indexOf(dateKey) !== -1) {
        sessionsByDay.set(dateKey, (sessionsByDay.get(dateKey) || 0) + 1);
        if (session.type === 'work' && session.status === 'completed') {
          focusTimeByDay.set(dateKey, (focusTimeByDay.get(dateKey) || 0) + (session.duration / 60));
        }
      }
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'short' })),
      sessions: last7Days.map(date => sessionsByDay.get(date) || 0),
      focusTime: last7Days.map(date => focusTimeByDay.get(date) || 0)
    };
  }

  private handleFilterChange(key: keyof SessionFilter, value: any): void {
    (this.filters as any)[key] = value;
    this.rerender();
  }

  private handleViewModeChange(mode: 'list' | 'calendar' | 'chart'): void {
    this.viewMode = mode;
    this.rerender();
  }

  private handleSortChange(sortBy: typeof this.sortBy): void {
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'desc';
    }
    this.rerender();
  }

  private handleSessionSelect(session: TimerSession): void {
    this.selectedSession = session;
    if (this.props.onSessionSelect) {
      this.props.onSessionSelect(session);
    }
    this.rerender();
  }

  private handleDeleteSession(sessionId: string): void {
    if (this.props.onDeleteSession && confirm('Are you sure you want to delete this session?')) {
      this.props.onDeleteSession(sessionId);
      this.sessions = this.sessions.filter(s => s.id !== sessionId);
      this.rerender();
    }
  }

  private handleExportData(format: 'csv' | 'json'): void {
    if (this.props.onExportData) {
      this.props.onExportData(format);
    } else {
      // Default export implementation
      const data = this.filterSessions();
      let content: string;
      let filename: string;

      if (format === 'csv') {
        const headers = ['Date', 'Type', 'Duration (min)', 'Status', 'Goal ID', 'Notes'];
        const rows = data.map(session => [
          new Date(session.startTime || session.endTime || '').toISOString(),
          session.type,
          (session.duration / 60).toFixed(1),
          session.status,
          session.goalId || '',
          session.notes || ''
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = 'timer-history.csv';
      } else {
        content = JSON.stringify(data, null, 2);
        filename = 'timer-history.json';
      }

      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  private getSessionTypeIcon(type: string): string {
    const icons = {
      work: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      shortBreak: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707',
      longBreak: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
    };
    return icons[type as keyof typeof icons] || icons.work;
  }

  private getStatusColor(status: string): string {
    const colors = {
      completed: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
      running: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
      paused: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      stopped: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status as keyof typeof colors] || colors.completed;
  }

  private renderFilters(): string {
    if (!this.props.showFilters) return '';

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap items-center gap-4">
          <!-- Date Range -->
          <select onchange="timerHistory.handleFilterChange('dateRange', this.value)"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Today</option>
            <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>This Week</option>
            <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>This Month</option>
            <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
            <option value="custom" ${this.filters.dateRange === 'custom' ? 'selected' : ''}>Custom Range</option>
          </select>

          <!-- Session Type -->
          <select onchange="timerHistory.handleFilterChange('sessionType', this.value)"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="all" ${this.filters.sessionType === 'all' ? 'selected' : ''}>All Types</option>
            <option value="work" ${this.filters.sessionType === 'work' ? 'selected' : ''}>Work Sessions</option>
            <option value="shortBreak" ${this.filters.sessionType === 'shortBreak' ? 'selected' : ''}>Short Breaks</option>
            <option value="longBreak" ${this.filters.sessionType === 'longBreak' ? 'selected' : ''}>Long Breaks</option>
          </select>

          <!-- Status -->
          <select onchange="timerHistory.handleFilterChange('status', this.value)"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Statuses</option>
            <option value="completed" ${this.filters.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="stopped" ${this.filters.status === 'stopped' ? 'selected' : ''}>Stopped</option>
          </select>

          <!-- View Mode -->
          <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onclick="timerHistory.handleViewModeChange('list')"
                    class="px-3 py-1 text-sm rounded ${this.viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}">
              List
            </button>
            <button onclick="timerHistory.handleViewModeChange('chart')"
                    class="px-3 py-1 text-sm rounded ${this.viewMode === 'chart' ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm' : 'text-gray-600 dark:text-gray-300'}">
              Chart
            </button>
          </div>

          <!-- Export -->
          <div class="ml-auto flex items-center space-x-2">
            <button onclick="timerHistory.handleExportData('csv')"
                    class="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Export CSV
            </button>
            <button onclick="timerHistory.handleExportData('json')"
                    class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export JSON
            </button>
          </div>
        </div>

        ${this.filters.dateRange === 'custom' ? `
          <div class="flex items-center space-x-4 mt-4">
            <input type="date" 
                   onchange="timerHistory.handleFilterChange('customStartDate', this.value)"
                   class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            <span class="text-gray-500 dark:text-gray-400">to</span>
            <input type="date" 
                   onchange="timerHistory.handleFilterChange('customEndDate', this.value)"
                   class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderAnalytics(): string {
    if (!this.props.showAnalytics) return '';

    const analytics = this.calculateAnalytics();

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.totalFocusTime.toFixed(1)}h</p>
              <p class="text-gray-600 dark:text-gray-400">Total Focus Time</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.completionRate.toFixed(1)}%</p>
              <p class="text-gray-600 dark:text-gray-400">Completion Rate</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.currentStreak}</p>
              <p class="text-gray-600 dark:text-gray-400">Current Streak</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-2xl font-bold text-gray-900 dark:text-white">${analytics.productivityScore.toFixed(0)}</p>
              <p class="text-gray-600 dark:text-gray-400">Productivity Score</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderChart(): string {
    if (this.viewMode !== 'chart') return '';

    const chartData = this.generateChartData();
    const maxSessions = Math.max(...chartData.sessions, 1);
    const maxFocusTime = Math.max(...chartData.focusTime, 1);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">7-Day Activity Chart</h3>
        
        <div class="relative h-64">
          <svg class="w-full h-full" viewBox="0 0 400 200">
            <!-- Grid lines -->
            ${Array.from({ length: 5 }, (_, i) => `
              <line x1="50" y1="${(i + 1) * 40}" x2="400" y2="${(i + 1) * 40}" 
                    stroke="#e5e7eb" stroke-width="1" opacity="0.5" />
            `).join('')}
            
            <!-- Y-axis -->
            <line x1="50" y1="0" x2="50" y2="200" stroke="#374151" stroke-width="2" />
            
            <!-- Sessions bars -->
            ${chartData.sessions.map((sessions, index) => {
              const x = 60 + (index * 45);
              const height = (sessions / maxSessions) * 160;
              const y = 200 - height;
              return `
                <rect x="${x}" y="${y}" width="20" height="${height}" 
                      fill="#3b82f6" opacity="0.8" />
                <text x="${x + 10}" y="195" text-anchor="middle" 
                      class="text-xs fill-gray-600 dark:fill-gray-400">
                  ${chartData.labels[index]}
                </text>
                <text x="${x + 10}" y="${y - 5}" text-anchor="middle" 
                      class="text-xs fill-gray-900 dark:fill-white">
                  ${sessions}
                </text>
              `;
            }).join('')}
            
            <!-- Focus time line -->
            <polyline
              fill="none"
              stroke="#ef4444"
              stroke-width="2"
              points="${chartData.focusTime.map((time, index) => {
                const x = 70 + (index * 45);
                const y = 200 - (time / maxFocusTime) * 160;
                return `${x},${y}`;
              }).join(' ')}"
            />
            
            <!-- Focus time points -->
            ${chartData.focusTime.map((time, index) => {
              const x = 70 + (index * 45);
              const y = 200 - (time / maxFocusTime) * 160;
              return `
                <circle cx="${x}" cy="${y}" r="3" fill="#ef4444" />
                <title>${time.toFixed(1)} hours</title>
              `;
            }).join('')}
          </svg>
          
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            ${Array.from({ length: 6 }, (_, i) => `
              <span>${Math.round((maxSessions / 5) * (5 - i))}</span>
            `).join('')}
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex items-center justify-center mt-4 space-x-6 text-sm">
          <div class="flex items-center">
            <div class="w-4 h-4 bg-blue-600 mr-2"></div>
            <span class="text-gray-600 dark:text-gray-400">Sessions</span>
          </div>
          <div class="flex items-center">
            <div class="w-4 h-0.5 bg-red-500 mr-2"></div>
            <span class="text-gray-600 dark:text-gray-400">Focus Time (hours)</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderSessionsList(): string {
    if (this.viewMode !== 'list') return '';

    const filteredSessions = this.filterSessions();

    if (filteredSessions.length === 0) {
      return `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No sessions found</h3>
          <p class="text-gray-600 dark:text-gray-400">Try adjusting your filters or start a new timer session.</p>
        </div>
      `;
    }

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Table Header -->
        <div class="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div class="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <button onclick="timerHistory.handleSortChange('date')" class="col-span-3 text-left hover:text-gray-700 dark:hover:text-gray-300">
              Date ${this.sortBy === 'date' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button onclick="timerHistory.handleSortChange('type')" class="col-span-2 text-left hover:text-gray-700 dark:hover:text-gray-300">
              Type ${this.sortBy === 'type' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button onclick="timerHistory.handleSortChange('duration')" class="col-span-2 text-left hover:text-gray-700 dark:hover:text-gray-300">
              Duration ${this.sortBy === 'duration' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button onclick="timerHistory.handleSortChange('status')" class="col-span-2 text-left hover:text-gray-700 dark:hover:text-gray-300">
              Status ${this.sortBy === 'status' ? (this.sortOrder === 'asc' ? '↑' : '↓') : ''}
            </button>
            <div class="col-span-2 text-left">Goal</div>
            <div class="col-span-1 text-right">Actions</div>
          </div>
        </div>

        <!-- Table Body -->
        <div class="divide-y divide-gray-200 dark:divide-gray-600">
          ${filteredSessions.map(session => `
            <div class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                 onclick="timerHistory.handleSessionSelect(${JSON.stringify(session).replace(/"/g, '&quot;')})">
              <div class="grid grid-cols-12 gap-4 items-center">
                <!-- Date -->
                <div class="col-span-3">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ${new Date(session.startTime || session.endTime || '').toLocaleDateString()}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    ${new Date(session.startTime || session.endTime || '').toLocaleTimeString()}
                  </div>
                </div>

                <!-- Type -->
                <div class="col-span-2">
                  <div class="flex items-center">
                    <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${this.getSessionTypeIcon(session.type)}" />
                    </svg>
                    <span class="text-sm text-gray-900 dark:text-white capitalize">
                      ${session.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                </div>

                <!-- Duration -->
                <div class="col-span-2">
                  <span class="text-sm text-gray-900 dark:text-white">
                    ${this.formatDuration(session.duration)}
                  </span>
                </div>

                <!-- Status -->
                <div class="col-span-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(session.status)}">
                    ${session.status}
                  </span>
                </div>

                <!-- Goal -->
                <div class="col-span-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    ${session.goalId ? `Goal #${session.goalId.slice(0, 8)}` : 'No goal'}
                  </span>
                </div>

                <!-- Actions -->
                <div class="col-span-1 text-right">
                  <button onclick="event.stopPropagation(); timerHistory.handleDeleteSession('${session.id}')"
                          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('timerHistoryContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).timerHistory = this;

    return `
      <div id="timerHistoryContainer" class="timer-history ${this.props.className}">
        ${this.renderAnalytics()}
        ${this.renderFilters()}
        ${this.renderChart()}
        ${this.renderSessionsList()}
      </div>
    `;
  }

  public updateSessions(sessions: TimerSession[]): void {
    this.sessions = [...sessions];
    this.rerender();
  }

  public getFilteredSessions(): TimerSession[] {
    return this.filterSessions();
  }

  public static create(props: TimerHistoryProps): TimerHistory {
    return new TimerHistory(props);
  }
}

// Export for use in other components
export { TimerHistory };
export type { TimerHistoryProps, SessionFilter, AnalyticsData, ChartData };
