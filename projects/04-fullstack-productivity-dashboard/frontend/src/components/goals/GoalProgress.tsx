/**
 * GoalProgress Component
 * 
 * Advanced progress tracking and visualization component for goals
 * with charts, analytics, and milestone tracking
 */

import { Goal } from './GoalCard';

interface GoalProgressProps {
  goal: Goal;
  milestones?: Milestone[];
  progressHistory?: ProgressEntry[];
  onUpdateProgress?: (goalId: string, progress: number) => void;
  onAddMilestone?: (goalId: string, milestone: Omit<Milestone, 'id'>) => void;
  className?: string;
  showChart?: boolean;
  showMilestones?: boolean;
  showAnalytics?: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

interface ProgressEntry {
  id: string;
  value: number;
  timestamp: string;
  note?: string;
}

interface AnalyticsData {
  totalDays: number;
  daysRemaining: number;
  progressRate: number;
  estimatedCompletion: string;
  consistency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * GoalProgress - Comprehensive progress tracking component
 */
class GoalProgress {
  private props: GoalProgressProps;
  private goal: Goal;
  private editingProgress: boolean;
  private newProgressValue: number;

  constructor(props: GoalProgressProps) {
    this.props = {
      milestones: [],
      progressHistory: [],
      className: '',
      showChart: true,
      showMilestones: true,
      showAnalytics: true,
      ...props
    };
    
    this.goal = props.goal;
    this.editingProgress = false;
    this.newProgressValue = this.goal.currentProgress;
  }

  private calculateProgress(): number {
    if (this.goal.targetValue === 0) return 0;
    return Math.min((this.goal.currentProgress / this.goal.targetValue) * 100, 100);
  }

  private calculateAnalytics(): AnalyticsData {
    const now = new Date();
    const created = new Date(this.goal.createdAt);
    const deadline = new Date(this.goal.deadline);
    
    const totalDays = Math.ceil((deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = totalDays - daysRemaining;
    
    const currentProgress = this.calculateProgress();
    const progressRate = daysPassed > 0 ? currentProgress / daysPassed : 0;
    
    const daysToComplete = progressRate > 0 ? (100 - currentProgress) / progressRate : Infinity;
    const estimatedCompletion = new Date(now.getTime() + (daysToComplete * 24 * 60 * 60 * 1000));
    
    // Calculate consistency and trend from progress history
    const history = this.props.progressHistory || [];
    let consistency = 0;
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    
    if (history.length >= 7) {
      const recent = history.slice(-7);
      const differences = recent.slice(1).map((entry, i) => entry.value - recent[i].value);
      const positiveDays = differences.filter(diff => diff > 0).length;
      consistency = (positiveDays / differences.length) * 100;
      
      const firstHalf = differences.slice(0, Math.floor(differences.length / 2));
      const secondHalf = differences.slice(Math.floor(differences.length / 2));
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.1) trend = 'increasing';
      else if (secondAvg < firstAvg * 0.9) trend = 'decreasing';
    }

    return {
      totalDays,
      daysRemaining: Math.max(0, daysRemaining),
      progressRate,
      estimatedCompletion: estimatedCompletion.toISOString().split('T')[0],
      consistency,
      trend
    };
  }

  private getMilestoneProgress(): { completed: number; total: number } {
    const milestones = this.props.milestones || [];
    const completed = milestones.filter(m => m.isCompleted).length;
    return { completed, total: milestones.length };
  }

  private handleProgressEdit(): void {
    this.editingProgress = true;
    this.newProgressValue = this.goal.currentProgress;
    this.rerender();
  }

  private handleProgressSave(): void {
    if (this.props.onUpdateProgress) {
      this.props.onUpdateProgress(this.goal.id, this.newProgressValue);
    }
    this.editingProgress = false;
    this.goal.currentProgress = this.newProgressValue;
    this.rerender();
  }

  private handleProgressCancel(): void {
    this.editingProgress = false;
    this.newProgressValue = this.goal.currentProgress;
    this.rerender();
  }

  private handleProgressChange(value: number): void {
    this.newProgressValue = Math.max(0, Math.min(value, this.goal.targetValue));
  }

  private renderProgressBar(): string {
    const progress = this.calculateProgress();
    const milestoneProgress = this.getMilestoneProgress();
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Progress Overview</h3>
          ${!this.editingProgress ? `
            <button onclick="goalProgress_${this.goal.id}.handleProgressEdit()" 
                    class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update
            </button>
          ` : ''}
        </div>

        <!-- Main Progress Bar -->
        <div class="mb-6">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span class="font-medium">${progress.toFixed(1)}%</span>
          </div>
          <div class="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" 
                 style="width: ${progress}%"></div>
            
            <!-- Milestone markers -->
            ${this.props.milestones ? this.props.milestones.map(milestone => {
              const position = (milestone.targetValue / this.goal.targetValue) * 100;
              return `
                <div class="absolute top-0 h-full w-0.5 ${milestone.isCompleted ? 'bg-green-500' : 'bg-yellow-500'}" 
                     style="left: ${position}%"
                     title="${milestone.title} (${milestone.targetValue})">
                </div>
              `;
            }).join('') : ''}
          </div>
          
          ${this.editingProgress ? `
            <div class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div class="flex items-center space-x-4">
                <input type="number" 
                       value="${this.newProgressValue}"
                       min="0" 
                       max="${this.goal.targetValue}"
                       onchange="goalProgress_${this.goal.id}.handleProgressChange(parseInt(this.value) || 0)"
                       class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
                <span class="text-sm text-gray-600 dark:text-gray-400">/ ${this.goal.targetValue}</span>
                <button onclick="goalProgress_${this.goal.id}.handleProgressSave()" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save
                </button>
                <button onclick="goalProgress_${this.goal.id}.handleProgressCancel()" 
                        class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Progress Stats -->
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.goal.currentProgress}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Current Progress</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.goal.targetValue}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Target Value</div>
          </div>
        </div>

        ${this.props.showMilestones && this.props.milestones && this.props.milestones.length > 0 ? `
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-medium text-gray-900 dark:text-white">Milestones</h4>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                ${milestoneProgress.completed}/${milestoneProgress.total} completed
              </span>
            </div>
            <div class="space-y-2">
              ${this.props.milestones.map(milestone => `
                <div class="flex items-center justify-between p-2 rounded-lg ${milestone.isCompleted ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-50 dark:bg-gray-700'}">
                  <div class="flex items-center">
                    <div class="w-4 h-4 rounded-full mr-3 ${milestone.isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}"></div>
                    <span class="text-sm ${milestone.isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}">${milestone.title}</span>
                  </div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">${milestone.targetValue}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderChart(): string {
    if (!this.props.showChart || !this.props.progressHistory || this.props.progressHistory.length === 0) {
      return '';
    }

    const history = this.props.progressHistory;
    const maxValue = Math.max(...history.map(entry => entry.value), this.goal.targetValue);
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress History</h3>
        
        <div class="relative h-64">
          <svg class="w-full h-full" viewBox="0 0 400 200">
            <!-- Grid lines -->
            ${Array.from({ length: 5 }, (_, i) => `
              <line x1="0" y1="${(i + 1) * 40}" x2="400" y2="${(i + 1) * 40}" 
                    stroke="#e5e7eb" stroke-width="1" opacity="0.5" />
            `).join('')}
            
            <!-- Progress line -->
            <polyline
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
              points="${history.map((entry, index) => {
                const x = (index / (history.length - 1)) * 400;
                const y = 200 - (entry.value / maxValue) * 180;
                return `${x},${y}`;
              }).join(' ')}"
            />
            
            <!-- Data points -->
            ${history.map((entry, index) => {
              const x = (index / (history.length - 1)) * 400;
              const y = 200 - (entry.value / maxValue) * 180;
              return `
                <circle cx="${x}" cy="${y}" r="4" fill="#3b82f6" />
                <title>${new Date(entry.timestamp).toLocaleDateString()}: ${entry.value}</title>
              `;
            }).join('')}
            
            <!-- Target line -->
            <line x1="0" y1="${200 - (this.goal.targetValue / maxValue) * 180}" 
                  x2="400" y2="${200 - (this.goal.targetValue / maxValue) * 180}" 
                  stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5" opacity="0.7" />
          </svg>
          
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -ml-8">
            ${Array.from({ length: 6 }, (_, i) => `
              <span>${Math.round((maxValue / 5) * (5 - i))}</span>
            `).join('')}
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex items-center justify-center mt-4 space-x-6 text-sm">
          <div class="flex items-center">
            <div class="w-3 h-0.5 bg-blue-600 mr-2"></div>
            <span class="text-gray-600 dark:text-gray-400">Progress</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-0.5 bg-red-500 border-dashed mr-2"></div>
            <span class="text-gray-600 dark:text-gray-400">Target</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderAnalytics(): string {
    if (!this.props.showAnalytics) return '';
    
    const analytics = this.calculateAnalytics();
    
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analytics & Insights</h3>
        
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${analytics.daysRemaining}</div>
            <div class="text-sm text-blue-800 dark:text-blue-300">Days Remaining</div>
          </div>
          <div class="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">${analytics.progressRate.toFixed(1)}%</div>
            <div class="text-sm text-green-800 dark:text-green-300">Daily Rate</div>
          </div>
          <div class="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${analytics.consistency.toFixed(0)}%</div>
            <div class="text-sm text-purple-800 dark:text-purple-300">Consistency</div>
          </div>
          <div class="text-center p-4 bg-orange-50 dark:bg-orange-900 rounded-lg">
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${analytics.trend === 'increasing' ? '↗' : analytics.trend === 'decreasing' ? '↘' : '→'}
            </div>
            <div class="text-sm text-orange-800 dark:text-orange-300">Trend</div>
          </div>
        </div>
        
        <!-- Insights -->
        <div class="space-y-3">
          <div class="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <svg class="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Estimated Completion</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Based on current progress rate, you're estimated to complete this goal by ${analytics.estimatedCompletion}
              </p>
            </div>
          </div>
          
          ${analytics.trend === 'increasing' ? `
            <div class="flex items-start p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-green-800 dark:text-green-200">Great momentum!</p>
                <p class="text-sm text-green-600 dark:text-green-300">Your progress rate is increasing. Keep up the excellent work!</p>
              </div>
            </div>
          ` : analytics.trend === 'decreasing' ? `
            <div class="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <svg class="w-5 h-5 text-yellow-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">Consider boosting your efforts</p>
                <p class="text-sm text-yellow-600 dark:text-yellow-300">Your progress rate has been slowing down. You might want to increase your daily efforts.</p>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById(`goalProgress_${this.goal.id}_container`);
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any)[`goalProgress_${this.goal.id}`] = this;

    return `
      <div id="goalProgress_${this.goal.id}_container" class="goal-progress space-y-6 ${this.props.className}">
        ${this.renderProgressBar()}
        ${this.renderChart()}
        ${this.renderAnalytics()}
      </div>
    `;
  }

  public updateGoal(updatedGoal: Goal): void {
    this.goal = updatedGoal;
    this.newProgressValue = updatedGoal.currentProgress;
    this.rerender();
  }

  public static create(props: GoalProgressProps): GoalProgress {
    return new GoalProgress(props);
  }
}

// Export for use in other components
export { GoalProgress };
export type { GoalProgressProps, Milestone, ProgressEntry, AnalyticsData };
