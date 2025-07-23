/**
 * GoalList Component
 * 
 * Container component for displaying, filtering, and managing multiple goals
 * with sorting, search, and bulk operations
 */

import { GoalCard, Goal, GoalCardProps } from './GoalCard';

interface GoalListProps {
  goals: Goal[];
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onToggleStatus?: (goalId: string) => void;
  onProgressUpdate?: (goalId: string, progress: number) => void;
  onBulkAction?: (action: string, goalIds: string[]) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

interface FilterOptions {
  search: string;
  category: string;
  status: string;
  priority: string;
  sortBy: 'title' | 'createdAt' | 'deadline' | 'progress' | 'priority';
  sortOrder: 'asc' | 'desc';
}

/**
 * GoalList - Comprehensive goal management component
 */
class GoalList {
  private props: GoalListProps;
  private filters: FilterOptions;
  private selectedGoals: Set<string>;
  private viewMode: 'grid' | 'list';

  constructor(props: GoalListProps) {
    this.props = {
      isLoading: false,
      error: '',
      className: '',
      ...props
    };
    
    this.filters = {
      search: '',
      category: '',
      status: '',
      priority: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    
    this.selectedGoals = new Set();
    this.viewMode = 'grid';
  }

  private filterGoals(): Goal[] {
    let filtered = [...this.props.goals];

    // Search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchLower) ||
        goal.description.toLowerCase().includes(searchLower) ||
        goal.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (this.filters.category) {
      filtered = filtered.filter(goal => goal.category === this.filters.category);
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(goal => goal.status === this.filters.status);
    }

    // Priority filter
    if (this.filters.priority) {
      filtered = filtered.filter(goal => goal.priority === this.filters.priority);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'deadline':
          comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          break;
        case 'progress':
          const progressA = (a.currentProgress / a.targetValue) * 100;
          const progressB = (b.currentProgress / b.targetValue) * 100;
          comparison = progressA - progressB;
          break;
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }
      
      return this.filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  private getUniqueCategories(): string[] {
    const categories = new Set(this.props.goals.map(goal => goal.category));
    return Array.from(categories).sort();
  }

  private handleSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filters.search = target.value;
    this.rerender();
  }

  private handleFilterChange(filterType: keyof FilterOptions, value: string): void {
    this.filters[filterType] = value as any;
    this.rerender();
  }

  private handleViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.rerender();
  }

  private handleSelectGoal(goalId: string, selected: boolean): void {
    if (selected) {
      this.selectedGoals.add(goalId);
    } else {
      this.selectedGoals.delete(goalId);
    }
    this.rerender();
  }

  private handleSelectAll(selected: boolean): void {
    const filteredGoals = this.filterGoals();
    if (selected) {
      filteredGoals.forEach(goal => this.selectedGoals.add(goal.id));
    } else {
      this.selectedGoals.clear();
    }
    this.rerender();
  }

  private handleBulkAction(action: string): void {
    if (this.selectedGoals.size === 0) return;
    
    const goalIds = Array.from(this.selectedGoals);
    if (this.props.onBulkAction) {
      this.props.onBulkAction(action, goalIds);
    }
    this.selectedGoals.clear();
    this.rerender();
  }

  private renderToolbar(): string {
    const filteredGoals = this.filterGoals();
    const allSelected = filteredGoals.length > 0 && 
                       filteredGoals.every(goal => this.selectedGoals.has(goal.id));

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <!-- Search and View Mode -->
        <div class="flex flex-col sm:flex-row gap-4 mb-4">
          <div class="flex-1">
            <div class="relative">
              <input type="text" 
                     placeholder="Search goals..." 
                     value="${this.filters.search}"
                     onchange="goalList.handleSearchChange(event)"
                     class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
              <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div class="flex items-center space-x-2">
            <button onclick="goalList.handleViewModeChange('grid')" 
                    class="p-2 ${this.viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button onclick="goalList.handleViewModeChange('list')" 
                    class="p-2 ${this.viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'} rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <select onchange="goalList.handleFilterChange('category', this.value)" 
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="">All Categories</option>
            ${this.getUniqueCategories().map(cat => `
              <option value="${cat}" ${this.filters.category === cat ? 'selected' : ''}>${cat}</option>
            `).join('')}
          </select>

          <select onchange="goalList.handleFilterChange('status', this.value)" 
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="">All Statuses</option>
            <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="completed" ${this.filters.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="paused" ${this.filters.status === 'paused' ? 'selected' : ''}>Paused</option>
            <option value="cancelled" ${this.filters.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>

          <select onchange="goalList.handleFilterChange('priority', this.value)" 
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="">All Priorities</option>
            <option value="low" ${this.filters.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${this.filters.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${this.filters.priority === 'high' ? 'selected' : ''}>High</option>
            <option value="urgent" ${this.filters.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
          </select>

          <select onchange="goalList.handleFilterChange('sortBy', this.value)" 
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="createdAt" ${this.filters.sortBy === 'createdAt' ? 'selected' : ''}>Created Date</option>
            <option value="title" ${this.filters.sortBy === 'title' ? 'selected' : ''}>Title</option>
            <option value="deadline" ${this.filters.sortBy === 'deadline' ? 'selected' : ''}>Deadline</option>
            <option value="progress" ${this.filters.sortBy === 'progress' ? 'selected' : ''}>Progress</option>
            <option value="priority" ${this.filters.sortBy === 'priority' ? 'selected' : ''}>Priority</option>
          </select>

          <select onchange="goalList.handleFilterChange('sortOrder', this.value)" 
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="desc" ${this.filters.sortOrder === 'desc' ? 'selected' : ''}>Descending</option>
            <option value="asc" ${this.filters.sortOrder === 'asc' ? 'selected' : ''}>Ascending</option>
          </select>
        </div>

        <!-- Bulk Actions -->
        ${this.selectedGoals.size > 0 ? `
          <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <span class="text-sm text-blue-800 dark:text-blue-200">
              ${this.selectedGoals.size} goal(s) selected
            </span>
            <div class="flex items-center space-x-2">
              <button onclick="goalList.handleBulkAction('complete')" 
                      class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Complete
              </button>
              <button onclick="goalList.handleBulkAction('pause')" 
                      class="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
                Pause
              </button>
              <button onclick="goalList.handleBulkAction('delete')" 
                      class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Select All -->
        <div class="flex items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <label class="flex items-center">
            <input type="checkbox" 
                   ${allSelected ? 'checked' : ''}
                   onchange="goalList.handleSelectAll(this.checked)"
                   class="mr-2 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Select all visible goals (${filteredGoals.length})
            </span>
          </label>
        </div>
      </div>
    `;
  }

  private renderGoals(): string {
    const filteredGoals = this.filterGoals();

    if (this.props.isLoading) {
      return `
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      `;
    }

    if (this.props.error) {
      return `
        <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 text-center">
          <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 class="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Goals</h3>
          <p class="text-red-600 dark:text-red-400">${this.props.error}</p>
        </div>
      `;
    }

    if (filteredGoals.length === 0) {
      return `
        <div class="text-center py-12">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No goals found</h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            ${this.props.goals.length === 0 ? 'Get started by creating your first goal.' : 'Try adjusting your filters.'}
          </p>
        </div>
      `;
    }

    const containerClass = this.viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4';

    return `
      <div class="${containerClass}">
        ${filteredGoals.map(goal => {
          const goalCard = new GoalCard({
            goal,
            onEdit: this.props.onEdit,
            onDelete: this.props.onDelete,
            onToggleStatus: this.props.onToggleStatus,
            onProgressUpdate: this.props.onProgressUpdate,
            viewMode: this.viewMode === 'list' ? 'list' : 'card'
          });

          return `
            <div class="relative">
              <label class="absolute top-4 left-4 z-10">
                <input type="checkbox" 
                       ${this.selectedGoals.has(goal.id) ? 'checked' : ''}
                       onchange="goalList.handleSelectGoal('${goal.id}', this.checked)"
                       class="text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              </label>
              <div class="pl-8">
                ${goalCard.render()}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('goalListContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).goalList = this;

    return `
      <div class="goal-list ${this.props.className}">
        ${this.renderToolbar()}
        ${this.renderGoals()}
      </div>
    `;
  }

  public updateGoals(goals: Goal[]): void {
    this.props.goals = goals;
    this.rerender();
  }

  public clearSelection(): void {
    this.selectedGoals.clear();
    this.rerender();
  }

  public getSelectedGoals(): string[] {
    return Array.from(this.selectedGoals);
  }

  public static create(props: GoalListProps): GoalList {
    return new GoalList(props);
  }
}

// Export for use in other components
export { GoalList };
export type { GoalListProps, FilterOptions };
