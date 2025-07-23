/**
 * StatsOverview Component
 * 
 * Comprehensive dashboard overview with key metrics, KPIs,
 * and real-time statistics for productivity tracking
 */

interface StatsOverviewProps {
  userId: string;
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  onRefresh?: () => void;
  onDateRangeChange?: (range: string) => void;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

interface DashboardStats {
  goals: {
    total: number;
    completed: number;
    active: number;
    overdue: number;
    completionRate: number;
    averageProgress: number;
  };
  timer: {
    totalSessions: number;
    completedSessions: number;
    totalFocusTime: number; // in hours
    averageSessionLength: number; // in minutes
    todaySessions: number;
    currentStreak: number;
    longestStreak: number;
  };
  productivity: {
    score: number; // 0-100
    trend: 'increasing' | 'decreasing' | 'stable';
    weeklyGoal: number; // hours
    weeklyActual: number; // hours
    efficiency: number; // percentage
  };
  achievements: {
    totalEarned: number;
    recentBadges: Achievement[];
    nextMilestone: Achievement | null;
    progressToNext: number; // percentage
  };
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
  progress?: number;
  target?: number;
  category: 'goals' | 'timer' | 'streak' | 'milestone';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  badge?: string;
  color: string;
}

/**
 * StatsOverview - Comprehensive dashboard statistics overview
 */
class StatsOverview {
  private props: StatsOverviewProps;
  private stats: DashboardStats | null;
  private isLoading: boolean;
  private error: string | null;
  private lastUpdated: Date | null;
  private refreshTimer: number | null;
  private quickActions: QuickAction[];

  constructor(props: StatsOverviewProps) {
    this.props = {
      dateRange: 'week',
      className: '',
      autoRefresh: true,
      refreshInterval: 30,
      ...props
    };
    
    this.stats = null;
    this.isLoading = false;
    this.error = null;
    this.lastUpdated = null;
    this.refreshTimer = null;
    
    this.quickActions = [
      {
        id: 'new-goal',
        title: 'New Goal',
        description: 'Create a new goal',
        icon: 'M12 4v16m8-8H4',
        action: () => this.handleNewGoal(),
        color: 'bg-blue-500'
      },
      {
        id: 'start-timer',
        title: 'Start Timer',
        description: 'Begin a focus session',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        action: () => this.handleStartTimer(),
        color: 'bg-green-500'
      },
      {
        id: 'view-analytics',
        title: 'Analytics',
        description: 'View detailed reports',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        action: () => this.handleViewAnalytics(),
        color: 'bg-purple-500'
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'Customize preferences',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        action: () => this.handleSettings(),
        color: 'bg-gray-500'
      }
    ];

    this.loadStats();
    this.setupAutoRefresh();
  }

  private async loadStats(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.rerender();

    try {
      // Simulate API call - replace with actual API endpoint
      const response = await fetch(`/api/dashboard/stats?userId=${this.props.userId}&range=${this.props.dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to load dashboard stats');
      }
      
      this.stats = await response.json();
      this.lastUpdated = new Date();
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
      // Use mock data for demonstration
      this.loadMockStats();
    }
    
    this.rerender();
  }

  private loadMockStats(): void {
    this.stats = {
      goals: {
        total: 12,
        completed: 8,
        active: 3,
        overdue: 1,
        completionRate: 66.7,
        averageProgress: 72.5
      },
      timer: {
        totalSessions: 89,
        completedSessions: 76,
        totalFocusTime: 45.5,
        averageSessionLength: 28,
        todaySessions: 4,
        currentStreak: 7,
        longestStreak: 15
      },
      productivity: {
        score: 85,
        trend: 'increasing',
        weeklyGoal: 25,
        weeklyActual: 22.5,
        efficiency: 90
      },
      achievements: {
        totalEarned: 15,
        recentBadges: [
          {
            id: 'streak-7',
            title: 'Week Warrior',
            description: '7-day focus streak',
            icon: '🔥',
            earnedAt: new Date().toISOString(),
            category: 'streak'
          },
          {
            id: 'goal-master',
            title: 'Goal Master',
            description: 'Completed 10 goals',
            icon: '🎯',
            earnedAt: new Date(Date.now() - 86400000).toISOString(),
            category: 'goals'
          }
        ],
        nextMilestone: {
          id: 'century-club',
          title: 'Century Club',
          description: 'Complete 100 timer sessions',
          icon: '💯',
          progress: 89,
          target: 100,
          category: 'timer'
        },
        progressToNext: 89
      }
    };
    this.lastUpdated = new Date();
  }

  private setupAutoRefresh(): void {
    if (this.props.autoRefresh && this.props.refreshInterval) {
      this.refreshTimer = window.setInterval(() => {
        this.loadStats();
      }, this.props.refreshInterval * 1000);
    }
  }

  private handleDateRangeChange(range: string): void {
    this.props.dateRange = range as any;
    if (this.props.onDateRangeChange) {
      this.props.onDateRangeChange(range);
    }
    this.loadStats();
  }

  private handleRefresh(): void {
    if (this.props.onRefresh) {
      this.props.onRefresh();
    }
    this.loadStats();
  }

  private handleNewGoal(): void {
    // Navigate to goal creation
    console.log('Navigate to new goal');
  }

  private handleStartTimer(): void {
    // Start timer session
    console.log('Start timer session');
  }

  private handleViewAnalytics(): void {
    // Navigate to analytics
    console.log('Navigate to analytics');
  }

  private handleSettings(): void {
    // Navigate to settings
    console.log('Navigate to settings');
  }

  private formatTime(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  }

  private getTrendIcon(trend: string): string {
    const icons = {
      increasing: '↗️',
      decreasing: '↘️',
      stable: '➡️'
    };
    return icons[trend as keyof typeof icons] || '➡️';
  }

  private getTrendColor(trend: string): string {
    const colors = {
      increasing: 'text-green-600 dark:text-green-400',
      decreasing: 'text-red-600 dark:text-red-400',
      stable: 'text-yellow-600 dark:text-yellow-400'
    };
    return colors[trend as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  }

  private renderHeader(): string {
    return `
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p class="text-gray-600 dark:text-gray-400">
            ${this.lastUpdated ? `Last updated: ${this.lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Date Range Selector -->
          <select onchange="statsOverview.handleDateRangeChange(this.value)"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="today" ${this.props.dateRange === 'today' ? 'selected' : ''}>Today</option>
            <option value="week" ${this.props.dateRange === 'week' ? 'selected' : ''}>This Week</option>
            <option value="month" ${this.props.dateRange === 'month' ? 'selected' : ''}>This Month</option>
            <option value="year" ${this.props.dateRange === 'year' ? 'selected' : ''}>This Year</option>
            <option value="all" ${this.props.dateRange === 'all' ? 'selected' : ''}>All Time</option>
          </select>
          
          <!-- Refresh Button -->
          <button onclick="statsOverview.handleRefresh()"
                  ${this.isLoading ? 'disabled' : ''}
                  class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <svg class="w-4 h-4 mr-2 ${this.isLoading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ${this.isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    `;
  }

  private renderGoalsStats(): string {
    if (!this.stats) return '';

    const { goals } = this.stats;
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Goals Overview</h3>
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${goals.total}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Goals</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${goals.completed}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>
        
        <div class="space-y-3">
          <!-- Completion Rate -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Completion Rate</span>
              <span class="font-medium text-gray-900 dark:text-white">${goals.completionRate.toFixed(1)}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-green-600 h-2 rounded-full" style="width: ${goals.completionRate}%"></div>
            </div>
          </div>
          
          <!-- Average Progress -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Average Progress</span>
              <span class="font-medium text-gray-900 dark:text-white">${goals.averageProgress.toFixed(1)}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${goals.averageProgress}%"></div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Active</span>
            <span class="font-medium text-blue-600 dark:text-blue-400">${goals.active}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">Overdue</span>
            <span class="font-medium text-red-600 dark:text-red-400">${goals.overdue}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderTimerStats(): string {
    if (!this.stats) return '';

    const { timer } = this.stats;
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Focus Time</h3>
          <div class="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.formatTime(timer.totalFocusTime)}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Focus</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">${timer.todaySessions}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Today's Sessions</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Avg Session</span>
              <span class="font-medium text-gray-900 dark:text-white">${timer.averageSessionLength}m</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Completed</span>
              <span class="font-medium text-green-600 dark:text-green-400">${timer.completedSessions}</span>
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Current Streak</span>
              <span class="font-medium text-orange-600 dark:text-orange-400">${timer.currentStreak} 🔥</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Best Streak</span>
              <span class="font-medium text-purple-600 dark:text-purple-400">${timer.longestStreak}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderProductivityScore(): string {
    if (!this.stats) return '';

    const { productivity } = this.stats;
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Productivity</h3>
          <div class="flex items-center space-x-2">
            <span class="text-2xl">${this.getTrendIcon(productivity.trend)}</span>
            <span class="text-sm ${this.getTrendColor(productivity.trend)}">${productivity.trend}</span>
          </div>
        </div>
        
        <div class="text-center mb-6">
          <div class="relative w-24 h-24 mx-auto">
            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" class="text-gray-200 dark:text-gray-700" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="8" 
                      class="${productivity.score >= 80 ? 'text-green-500' : productivity.score >= 60 ? 'text-yellow-500' : 'text-red-500'}"
                      stroke-linecap="round"
                      stroke-dasharray="251"
                      stroke-dashoffset="${251 - (251 * productivity.score) / 100}" />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">${productivity.score}</span>
            </div>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">Productivity Score</div>
        </div>
        
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">Weekly Goal</span>
              <span class="font-medium text-gray-900 dark:text-white">${this.formatTime(productivity.weeklyActual)} / ${this.formatTime(productivity.weeklyGoal)}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div class="bg-purple-600 h-2 rounded-full" style="width: ${(productivity.weeklyActual / productivity.weeklyGoal) * 100}%"></div>
            </div>
          </div>
          
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Efficiency</span>
            <span class="font-medium text-green-600 dark:text-green-400">${productivity.efficiency}%</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderAchievements(): string {
    if (!this.stats) return '';

    const { achievements } = this.stats;
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h3>
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div class="text-center mb-4">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">${achievements.totalEarned}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Total Badges Earned</div>
        </div>
        
        <!-- Recent Badges -->
        <div class="space-y-2 mb-4">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white">Recent Badges</h4>
          ${achievements.recentBadges.map(badge => `
            <div class="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span class="text-2xl">${badge.icon}</span>
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900 dark:text-white">${badge.title}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">${badge.description}</div>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                ${new Date(badge.earnedAt || '').toLocaleDateString()}
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Next Milestone -->
        ${achievements.nextMilestone ? `
          <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Next Milestone</h4>
            <div class="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <span class="text-2xl">${achievements.nextMilestone.icon}</span>
              <div class="flex-1">
                <div class="text-sm font-medium text-gray-900 dark:text-white">${achievements.nextMilestone.title}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">${achievements.nextMilestone.description}</div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${achievements.progressToNext}%"></div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${achievements.nextMilestone.progress}/${achievements.nextMilestone.target}
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderQuickActions(): string {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-3">
          ${this.quickActions.map(action => `
            <button onclick="statsOverview.quickActions.find(a => a.id === '${action.id}').action()"
                    class="flex items-center p-3 ${action.color} text-white rounded-lg hover:opacity-90 transition-opacity">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${action.icon}" />
              </svg>
              <div class="text-left">
                <div class="font-medium text-sm">${action.title}</div>
                <div class="text-xs opacity-90">${action.description}</div>
              </div>
              ${action.badge ? `<span class="ml-auto bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">${action.badge}</span>` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderLoading(): string {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${Array.from({ length: 6 }, () => `
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderError(): string {
    return `
      <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
        <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Dashboard</h3>
        <p class="text-red-600 dark:text-red-400 mb-4">${this.error}</p>
        <button onclick="statsOverview.handleRefresh()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Try Again
        </button>
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('statsOverviewContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).statsOverview = this;

    return `
      <div id="statsOverviewContainer" class="stats-overview ${this.props.className}">
        ${this.renderHeader()}
        
        ${this.isLoading ? this.renderLoading() :
          this.error ? this.renderError() :
          `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.renderGoalsStats()}
            ${this.renderTimerStats()}
            ${this.renderProductivityScore()}
            ${this.renderAchievements()}
            ${this.renderQuickActions()}
          </div>`
        }
      </div>
    `;
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  public updateDateRange(range: string): void {
    this.props.dateRange = range as any;
    this.loadStats();
  }

  public static create(props: StatsOverviewProps): StatsOverview {
    return new StatsOverview(props);
  }
}

// Export for use in other components
export { StatsOverview };
export type { StatsOverviewProps, DashboardStats, Achievement, QuickAction };
