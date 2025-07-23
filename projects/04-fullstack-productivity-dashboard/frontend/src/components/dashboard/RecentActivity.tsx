/**
 * RecentActivity Component
 * 
 * Real-time activity feed with session logs, goal updates,
 * achievement notifications, and comprehensive user action history
 */

interface RecentActivityProps {
  userId: string;
  limit?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onActivityClick?: (activity: ActivityItem) => void;
  onFilterChange?: (filters: ActivityFilters) => void;
  className?: string;
  showExport?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'goal' | 'timer' | 'achievement' | 'session' | 'system';
  action: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    goalId?: string;
    timerId?: string;
    sessionId?: string;
    achievementId?: string;
    duration?: number;
    progress?: number;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  isRead?: boolean;
  isStarred?: boolean;
}

interface ActivityFilters {
  types: string[];
  dateRange: 'today' | 'week' | 'month' | 'all';
  status?: string[];
  search?: string;
  isRead?: boolean;
  isStarred?: boolean;
}

interface ActivityStats {
  totalActivities: number;
  todayActivities: number;
  unreadCount: number;
  starredCount: number;
  typeBreakdown: { [key: string]: number };
}

/**
 * RecentActivity - Real-time activity feed with comprehensive filtering
 */
class RecentActivity {
  private props: RecentActivityProps;
  private activities: ActivityItem[];
  private filteredActivities: ActivityItem[];
  private stats: ActivityStats | null;
  private filters: ActivityFilters;
  private isLoading: boolean;
  private error: string | null;
  private refreshTimer: number | null;
  private selectedActivity: ActivityItem | null;

  constructor(props: RecentActivityProps) {
    this.props = {
      limit: 50,
      showFilters: true,
      showSearch: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      className: '',
      showExport: true,
      ...props
    };
    
    this.activities = [];
    this.filteredActivities = [];
    this.stats = null;
    this.filters = {
      types: ['goal', 'timer', 'achievement', 'session', 'system'],
      dateRange: 'week',
      search: '',
      isRead: undefined,
      isStarred: undefined
    };
    this.isLoading = false;
    this.error = null;
    this.refreshTimer = null;
    this.selectedActivity = null;

    this.loadActivities();
    this.setupAutoRefresh();
  }

  private async loadActivities(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.rerender();

    try {
      // Simulate API call
      const response = await fetch(`/api/activities?userId=${this.props.userId}&limit=${this.props.limit}`);
      if (!response.ok) {
        throw new Error('Failed to load activities');
      }
      
      const data = await response.json();
      this.activities = data.activities;
      this.stats = data.stats;
      this.applyFilters();
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
      this.loadMockData();
    }
    
    this.rerender();
  }

  private loadMockData(): void {
    const now = new Date();
    const activities: ActivityItem[] = [];

    // Generate mock activities
    const activityTemplates = [
      { type: 'goal', action: 'created', title: 'New goal created', description: 'Created "Complete React course"' },
      { type: 'goal', action: 'updated', title: 'Goal progress updated', description: 'Updated progress to 75%' },
      { type: 'goal', action: 'completed', title: 'Goal completed', description: 'Completed "Daily workout routine"' },
      { type: 'timer', action: 'started', title: 'Timer session started', description: 'Started 25-minute focus session' },
      { type: 'timer', action: 'completed', title: 'Timer session completed', description: 'Completed 25-minute Pomodoro session' },
      { type: 'timer', action: 'paused', title: 'Timer session paused', description: 'Paused session at 15 minutes' },
      { type: 'achievement', action: 'earned', title: 'Achievement unlocked', description: 'Earned "Early Bird" badge' },
      { type: 'achievement', action: 'milestone', title: 'Milestone reached', description: 'Reached 100 hours of focused work' },
      { type: 'session', action: 'login', title: 'User logged in', description: 'Logged in from Chrome browser' },
      { type: 'session', action: 'settings', title: 'Settings updated', description: 'Updated notification preferences' },
      { type: 'system', action: 'backup', title: 'Data backed up', description: 'Daily backup completed successfully' }
    ];

    for (let i = 0; i < 30; i++) {
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const timestamp = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // Every 2 hours
      
      activities.push({
        id: `activity_${i}`,
        type: template.type as any,
        action: template.action,
        title: template.title,
        description: template.description,
        timestamp: timestamp.toISOString(),
        metadata: {
          duration: template.type === 'timer' ? Math.floor(Math.random() * 60) + 15 : undefined,
          progress: template.type === 'goal' ? Math.floor(Math.random() * 100) : undefined,
          tags: ['productivity', 'focus'],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
        },
        status: ['success', 'info', 'warning'][Math.floor(Math.random() * 3)] as any,
        isRead: Math.random() > 0.3,
        isStarred: Math.random() > 0.8
      });
    }

    this.activities = activities;
    this.stats = {
      totalActivities: activities.length,
      todayActivities: activities.filter(a => this.isToday(new Date(a.timestamp))).length,
      unreadCount: activities.filter(a => !a.isRead).length,
      starredCount: activities.filter(a => a.isStarred).length,
      typeBreakdown: {
        goal: activities.filter(a => a.type === 'goal').length,
        timer: activities.filter(a => a.type === 'timer').length,
        achievement: activities.filter(a => a.type === 'achievement').length,
        session: activities.filter(a => a.type === 'session').length,
        system: activities.filter(a => a.type === 'system').length
      }
    };

    this.applyFilters();
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  private setupAutoRefresh(): void {
    if (this.props.autoRefresh && this.props.refreshInterval) {
      this.refreshTimer = window.setInterval(() => {
        this.loadActivities();
      }, this.props.refreshInterval);
    }
  }

  private applyFilters(): void {
    let filtered = [...this.activities];

    // Filter by type
    if (this.filters.types.length > 0) {
      filtered = filtered.filter(activity => this.filters.types.indexOf(activity.type) !== -1);
    }

    // Filter by date range
    const now = new Date();
    switch (this.filters.dateRange) {
      case 'today':
        filtered = filtered.filter(activity => this.isToday(new Date(activity.timestamp)));
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(activity => new Date(activity.timestamp) > weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(activity => new Date(activity.timestamp) > monthAgo);
        break;
    }

    // Filter by search
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().indexOf(searchLower) !== -1 ||
        activity.description.toLowerCase().indexOf(searchLower) !== -1
      );
    }

    // Filter by read status
    if (this.filters.isRead !== undefined) {
      filtered = filtered.filter(activity => activity.isRead === this.filters.isRead);
    }

    // Filter by starred status
    if (this.filters.isStarred !== undefined) {
      filtered = filtered.filter(activity => activity.isStarred === this.filters.isStarred);
    }

    this.filteredActivities = filtered;
  }

  private handleFilterChange(key: keyof ActivityFilters, value: any): void {
    this.filters = { ...this.filters, [key]: value };
    this.applyFilters();
    
    if (this.props.onFilterChange) {
      this.props.onFilterChange(this.filters);
    }
    
    this.rerender();
  }

  private handleSearch(query: string): void {
    this.handleFilterChange('search', query);
  }

  private handleActivityClick(activity: ActivityItem): void {
    this.selectedActivity = activity;
    
    // Mark as read
    if (!activity.isRead) {
      this.markAsRead(activity.id);
    }
    
    if (this.props.onActivityClick) {
      this.props.onActivityClick(activity);
    }
  }

  private async markAsRead(activityId: string): Promise<void> {
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isRead = true;
      this.rerender();
      
      // Simulate API call
      try {
        await fetch(`/api/activities/${activityId}/read`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  }

  private async toggleStar(activityId: string): Promise<void> {
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.isStarred = !activity.isStarred;
      this.rerender();
      
      // Simulate API call
      try {
        await fetch(`/api/activities/${activityId}/star`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ starred: activity.isStarred })
        });
      } catch (error) {
        console.error('Failed to toggle star:', error);
      }
    }
  }

  private async exportActivities(): Promise<void> {
    try {
      const data = this.filteredActivities.map(activity => ({
        timestamp: activity.timestamp,
        type: activity.type,
        action: activity.action,
        title: activity.title,
        description: activity.description,
        status: activity.status
      }));

      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `activities-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export activities:', error);
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.indexOf(',') !== -1 ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  private getActivityIcon(type: string): string {
    const icons = {
      goal: '🎯',
      timer: '⏱️',
      achievement: '🏆',
      session: '👤',
      system: '⚙️'
    };
    return icons[type as keyof typeof icons] || '📝';
  }

  private getStatusColor(status: string): string {
    const colors = {
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
      error: 'text-red-600 dark:text-red-400',
      info: 'text-blue-600 dark:text-blue-400'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 dark:text-gray-400';
  }

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  }

  private renderFilters(): string {
    if (!this.props.showFilters) return '';

    return `
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Activity Types -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Types</label>
            <div class="space-y-2">
              ${['goal', 'timer', 'achievement', 'session', 'system'].map(type => `
                <label class="flex items-center">
                  <input type="checkbox" 
                         ${this.filters.types.indexOf(type) !== -1 ? 'checked' : ''}
                         onchange="recentActivity.handleFilterChange('types', this.checked ? [...recentActivity.filters.types, '${type}'] : recentActivity.filters.types.filter(t => t !== '${type}'))"
                         class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
                  <span class="text-sm text-gray-700 dark:text-gray-300">${this.getActivityIcon(type)} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
            <select onchange="recentActivity.handleFilterChange('dateRange', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white">
              <option value="today" ${this.filters.dateRange === 'today' ? 'selected' : ''}>Today</option>
              <option value="week" ${this.filters.dateRange === 'week' ? 'selected' : ''}>This Week</option>
              <option value="month" ${this.filters.dateRange === 'month' ? 'selected' : ''}>This Month</option>
              <option value="all" ${this.filters.dateRange === 'all' ? 'selected' : ''}>All Time</option>
            </select>
          </div>

          <!-- Read Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Read Status</label>
            <select onchange="recentActivity.handleFilterChange('isRead', this.value === 'all' ? undefined : this.value === 'read')"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white">
              <option value="all">All</option>
              <option value="read" ${this.filters.isRead === true ? 'selected' : ''}>Read</option>
              <option value="unread" ${this.filters.isRead === false ? 'selected' : ''}>Unread</option>
            </select>
          </div>

          <!-- Actions -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</label>
            <div class="space-y-2">
              <button onclick="recentActivity.handleFilterChange('isStarred', recentActivity.filters.isStarred ? undefined : true)"
                      class="w-full px-3 py-2 text-sm ${this.filters.isStarred ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'} rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors">
                ${this.filters.isStarred ? '⭐ Starred Only' : '☆ Show Starred'}
              </button>
              ${this.props.showExport ? `
                <button onclick="recentActivity.exportActivities()"
                        class="w-full px-3 py-2 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  📊 Export CSV
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderSearch(): string {
    if (!this.props.showSearch) return '';

    return `
      <div class="mb-4">
        <div class="relative">
          <input type="text" 
                 placeholder="Search activities..."
                 value="${this.filters.search || ''}"
                 oninput="recentActivity.handleSearch(this.value)"
                 class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    `;
  }

  private renderStats(): string {
    if (!this.stats) return '';

    return `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${this.stats.totalActivities}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Total Activities</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">${this.stats.todayActivities}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Today</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${this.stats.unreadCount}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Unread</div>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${this.stats.starredCount}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Starred</div>
        </div>
      </div>
    `;
  }

  private renderActivities(): string {
    if (this.filteredActivities.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <div class="text-6xl mb-4">📭</div>
          <div class="text-lg font-medium mb-2">No activities found</div>
          <div class="text-sm">Try adjusting your filters or check back later</div>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${this.filteredActivities.map(activity => `
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer ${!activity.isRead ? 'border-l-4 border-l-blue-500' : ''}"
               onclick="recentActivity.handleActivityClick(${JSON.stringify(activity).replace(/"/g, '&quot;')})">
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-3 flex-1">
                <div class="text-2xl">${this.getActivityIcon(activity.type)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2 mb-1">
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">${activity.title}</h3>
                    <span class="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      ${activity.type}
                    </span>
                    ${activity.status ? `
                      <span class="text-xs ${this.getStatusColor(activity.status)}">●</span>
                    ` : ''}
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${activity.description}</p>
                  <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>${this.formatTimestamp(activity.timestamp)}</span>
                    ${activity.metadata?.duration ? `<span>⏱️ ${activity.metadata.duration}min</span>` : ''}
                    ${activity.metadata?.progress ? `<span>📊 ${activity.metadata.progress}%</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center space-x-2 ml-3">
                <button onclick="event.stopPropagation(); recentActivity.toggleStar('${activity.id}')"
                        class="text-gray-400 hover:text-yellow-500 transition-colors">
                  ${activity.isStarred ? '⭐' : '☆'}
                </button>
                ${!activity.isRead ? `
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private renderLoading(): string {
    return `
      <div class="space-y-3">
        ${Array.from({ length: 5 }, (_, i) => `
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div class="flex items-start space-x-3">
              <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('recentActivityContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).recentActivity = this;

    return `
      <div id="recentActivityContainer" class="recent-activity ${this.props.className}">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            <button onclick="recentActivity.loadActivities()"
                    class="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
              🔄 Refresh
            </button>
          </div>

          ${this.renderStats()}
          ${this.renderFilters()}
          ${this.renderSearch()}
          
          <div class="activity-list">
            ${this.isLoading ? this.renderLoading() : this.renderActivities()}
          </div>
        </div>
      </div>
    `;
  }

  public refresh(): void {
    this.loadActivities();
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  public static create(props: RecentActivityProps): RecentActivity {
    return new RecentActivity(props);
  }
}

// Export for use in other components
export { RecentActivity };
export type { RecentActivityProps, ActivityItem, ActivityFilters, ActivityStats };
