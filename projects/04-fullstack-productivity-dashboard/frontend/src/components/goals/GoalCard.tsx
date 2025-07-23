/**
 * GoalCard Component
 * 
 * Individual goal card component for displaying goal information
 * with progress, actions, and status indicators
 */

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetValue: number;
  currentProgress: number;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
  onToggleStatus?: (goalId: string) => void;
  onProgressUpdate?: (goalId: string, progress: number) => void;
  className?: string;
  viewMode?: 'card' | 'list';
}

/**
 * GoalCard - Individual goal display component
 */
class GoalCard {
  private props: GoalCardProps;
  private goal: Goal;

  constructor(props: GoalCardProps) {
    this.props = {
      viewMode: 'card',
      className: '',
      ...props
    };
    this.goal = props.goal;
  }

  private getPriorityColor(): string {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      urgent: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[this.goal.priority] || colors.medium;
  }

  private getStatusColor(): string {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[this.goal.status] || colors.active;
  }

  private calculateProgress(): number {
    if (this.goal.targetValue === 0) return 0;
    return Math.min((this.goal.currentProgress / this.goal.targetValue) * 100, 100);
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} days`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private handleEdit(): void {
    if (this.props.onEdit) {
      this.props.onEdit(this.goal);
    }
  }

  private handleDelete(): void {
    if (this.props.onDelete && confirm('Are you sure you want to delete this goal?')) {
      this.props.onDelete(this.goal.id);
    }
  }

  private handleToggleStatus(): void {
    if (this.props.onToggleStatus) {
      this.props.onToggleStatus(this.goal.id);
    }
  }

  private renderProgressBar(): string {
    const progress = this.calculateProgress();
    return `
      <div class="mt-4">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>${progress.toFixed(1)}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
               style="width: ${progress}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>${this.goal.currentProgress}</span>
          <span>${this.goal.targetValue}</span>
        </div>
      </div>
    `;
  }

  private renderTags(): string {
    if (!this.goal.tags || this.goal.tags.length === 0) return '';
    
    return `
      <div class="flex flex-wrap gap-1 mt-2">
        ${this.goal.tags.map(tag => `
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            ${tag}
          </span>
        `).join('')}
      </div>
    `;
  }

  private renderActions(): string {
    return `
      <div class="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button onclick="goalCard_${this.goal.id}.handleEdit()" 
                class="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-md transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button onclick="goalCard_${this.goal.id}.handleToggleStatus()" 
                class="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900 rounded-md transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          ${this.goal.status === 'completed' ? 'Reopen' : 'Complete'}
        </button>
        <button onclick="goalCard_${this.goal.id}.handleDelete()" 
                class="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    `;
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any)[`goalCard_${this.goal.id}`] = this;
    
    const progress = this.calculateProgress();
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow ${this.props.className}">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ${this.goal.title}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              ${this.goal.description}
            </p>
          </div>
          <div class="flex flex-col items-end space-y-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${this.getPriorityColor()}">
              ${this.goal.priority.toUpperCase()}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${this.getStatusColor()}">
              ${this.goal.status.toUpperCase()}
            </span>
          </div>
        </div>

        <!-- Category and Deadline -->
        <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            ${this.goal.category}
          </span>
          <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${this.formatDate(this.goal.deadline)}
          </span>
        </div>

        <!-- Progress Bar -->
        ${this.renderProgressBar()}

        <!-- Tags -->
        ${this.renderTags()}

        <!-- Actions -->
        ${this.renderActions()}
      </div>
    `;
  }

  public updateGoal(updatedGoal: Goal): void {
    this.goal = updatedGoal;
  }

  public static create(props: GoalCardProps): GoalCard {
    return new GoalCard(props);
  }
}

// Export for use in other components
export { GoalCard };
export type { GoalCardProps, Goal };
