/**
 * GoalForm Component
 * 
 * Comprehensive form component for creating and editing goals
 * with validation, auto-save, and rich input options
 */

import { Goal } from './GoalCard';

interface GoalFormProps {
  goal?: Goal;
  onSubmit: (goalData: Partial<Goal>) => void;
  onCancel: () => void;
  onDelete?: (goalId: string) => void;
  isLoading?: boolean;
  error?: string;
  categories?: string[];
  className?: string;
  mode?: 'create' | 'edit';
}

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetValue: number;
  currentProgress: number;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  tags: string[];
}

interface ValidationErrors {
  title?: string;
  description?: string;
  category?: string;
  targetValue?: string;
  deadline?: string;
  general?: string;
}

/**
 * GoalForm - Comprehensive goal creation and editing form
 */
class GoalForm {
  private props: GoalFormProps;
  private formData: FormData;
  private errors: ValidationErrors;
  private isDirty: boolean;
  private autoSaveTimer: number | null;

  constructor(props: GoalFormProps) {
    this.props = {
      isLoading: false,
      error: '',
      categories: [],
      className: '',
      mode: 'create',
      ...props
    };
    
    // Initialize form data
    this.formData = this.initializeFormData();
    this.errors = {};
    this.isDirty = false;
    this.autoSaveTimer = null;
  }

  private initializeFormData(): FormData {
    if (this.props.goal) {
      return {
        title: this.props.goal.title,
        description: this.props.goal.description,
        category: this.props.goal.category,
        priority: this.props.goal.priority,
        targetValue: this.props.goal.targetValue,
        currentProgress: this.props.goal.currentProgress,
        deadline: this.props.goal.deadline.split('T')[0], // Convert to YYYY-MM-DD format
        status: this.props.goal.status,
        tags: this.props.goal.tags || []
      };
    }

    return {
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      targetValue: 100,
      currentProgress: 0,
      deadline: '',
      status: 'active',
      tags: []
    };
  }

  private validateField(field: keyof FormData, value: any): string | null {
    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) {
          return 'Title is required';
        }
        if (value.length > 100) {
          return 'Title must be less than 100 characters';
        }
        break;

      case 'description':
        if (value && value.length > 500) {
          return 'Description must be less than 500 characters';
        }
        break;

      case 'category':
        if (!value || value.trim().length === 0) {
          return 'Category is required';
        }
        break;

      case 'targetValue':
        if (!value || value <= 0) {
          return 'Target value must be greater than 0';
        }
        if (value > 1000000) {
          return 'Target value must be less than 1,000,000';
        }
        break;

      case 'deadline':
        if (!value) {
          return 'Deadline is required';
        }
        const deadline = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadline < today) {
          return 'Deadline cannot be in the past';
        }
        break;
    }
    return null;
  }

  private validateForm(): boolean {
    this.errors = {};
    
    // Validate all required fields
    Object.keys(this.formData).forEach(key => {
      const field = key as keyof FormData;
      const error = this.validateField(field, this.formData[field]);
      if (error) {
        this.errors[field as keyof ValidationErrors] = error;
      }
    });

    // Cross-field validation
    if (this.formData.currentProgress > this.formData.targetValue) {
      this.errors.general = 'Current progress cannot exceed target value';
    }

    return Object.keys(this.errors).length === 0;
  }

  private handleInputChange(field: keyof FormData, value: any): void {
    (this.formData as any)[field] = value;
    this.isDirty = true;

    // Clear field error
    if (this.errors[field as keyof ValidationErrors]) {
      delete this.errors[field as keyof ValidationErrors];
    }

    // Trigger auto-save for edit mode
    if (this.props.mode === 'edit') {
      this.scheduleAutoSave();
    }

    this.rerender();
  }

  private handleTagInput(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const tag = input.value.trim();
      if (tag && this.formData.tags.indexOf(tag) === -1) {
        this.formData.tags.push(tag);
        input.value = '';
        this.isDirty = true;
        this.rerender();
      }
    }
  }

  private removeTag(tag: string): void {
    this.formData.tags = this.formData.tags.filter(t => t !== tag);
    this.isDirty = true;
    this.rerender();
  }

  private scheduleAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = window.setTimeout(() => {
      if (this.isDirty && this.validateForm()) {
        this.handleAutoSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
  }

  private handleAutoSave(): void {
    // Auto-save logic here
    console.log('Auto-saving goal...');
    this.isDirty = false;
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.validateForm()) {
      this.rerender();
      return;
    }

    const goalData: Partial<Goal> = {
      ...this.formData,
      deadline: new Date(this.formData.deadline).toISOString()
    };

    this.props.onSubmit(goalData);
  }

  private handleCancel(): void {
    if (this.isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.props.onCancel();
      }
    } else {
      this.props.onCancel();
    }
  }

  private handleDelete(): void {
    if (this.props.onDelete && this.props.goal) {
      if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
        this.props.onDelete(this.props.goal.id);
      }
    }
  }

  private renderFormField(
    field: keyof FormData, 
    label: string, 
    type: string = 'text', 
    options?: { placeholder?: string; min?: number; max?: number; step?: number }
  ): string {
    const error = this.errors[field as keyof ValidationErrors];
    const value = this.formData[field];

    return `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ${label}
          ${this.isFieldRequired(field) ? '<span class="text-red-500">*</span>' : ''}
        </label>
        <input type="${type}" 
               value="${value}" 
               onchange="goalForm.handleInputChange('${field}', this.value)"
               ${options?.placeholder ? `placeholder="${options.placeholder}"` : ''}
               ${options?.min !== undefined ? `min="${options.min}"` : ''}
               ${options?.max !== undefined ? `max="${options.max}"` : ''}
               ${options?.step !== undefined ? `step="${options.step}"` : ''}
               class="w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${error ? 'bg-red-50 dark:bg-red-900' : ''}" />
        ${error ? `<p class="mt-1 text-sm text-red-600 dark:text-red-400">${error}</p>` : ''}
      </div>
    `;
  }

  private renderSelectField(field: keyof FormData, label: string, options: { value: string; label: string }[]): string {
    const error = this.errors[field as keyof ValidationErrors];
    const value = this.formData[field];

    return `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ${label}
          ${this.isFieldRequired(field) ? '<span class="text-red-500">*</span>' : ''}
        </label>
        <select onchange="goalForm.handleInputChange('${field}', this.value)"
                class="w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
          ${options.map(option => `
            <option value="${option.value}" ${value === option.value ? 'selected' : ''}>${option.label}</option>
          `).join('')}
        </select>
        ${error ? `<p class="mt-1 text-sm text-red-600 dark:text-red-400">${error}</p>` : ''}
      </div>
    `;
  }

  private renderTextareaField(field: keyof FormData, label: string, rows: number = 3): string {
    const error = this.errors[field as keyof ValidationErrors];
    const value = this.formData[field];

    return `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ${label}
          ${this.isFieldRequired(field) ? '<span class="text-red-500">*</span>' : ''}
        </label>
        <textarea rows="${rows}" 
                  onchange="goalForm.handleInputChange('${field}', this.value)"
                  class="w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none">${value}</textarea>
        ${error ? `<p class="mt-1 text-sm text-red-600 dark:text-red-400">${error}</p>` : ''}
      </div>
    `;
  }

  private renderTagsField(): string {
    return `
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div class="space-y-2">
          ${this.formData.tags.length > 0 ? `
            <div class="flex flex-wrap gap-2">
              ${this.formData.tags.map(tag => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  ${tag}
                  <button type="button" onclick="goalForm.removeTag('${tag}')" class="ml-1 text-blue-600 hover:text-blue-800">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              `).join('')}
            </div>
          ` : ''}
          <input type="text" 
                 placeholder="Enter tag and press Enter or comma"
                 onkeydown="goalForm.handleTagInput(event)"
                 class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white" />
        </div>
      </div>
    `;
  }

  private isFieldRequired(field: keyof FormData): boolean {
    const requiredFields = ['title', 'category', 'targetValue', 'deadline'];
    return requiredFields.indexOf(field) !== -1;
  }

  private rerender(): void {
    const container = document.getElementById('goalFormContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).goalForm = this;

    const priorityOptions = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' }
    ];

    const statusOptions = [
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'paused', label: 'Paused' },
      { value: 'cancelled', label: 'Cancelled' }
    ];

    const categoryOptions = this.props.categories?.map(cat => ({ value: cat, label: cat })) || [];
    if (!categoryOptions.find(opt => opt.value === this.formData.category)) {
      categoryOptions.unshift({ value: '', label: 'Select a category' });
    }

    return `
      <div class="goal-form bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${this.props.className}">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            ${this.props.mode === 'edit' ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          ${this.isDirty ? `
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Unsaved changes
            </span>
          ` : ''}
        </div>

        ${this.props.error ? `
          <div class="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div class="flex">
              <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div class="ml-3">
                <p class="text-sm text-red-800 dark:text-red-200">${this.props.error}</p>
              </div>
            </div>
          </div>
        ` : ''}

        ${this.errors.general ? `
          <div class="mb-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p class="text-sm text-red-800 dark:text-red-200">${this.errors.general}</p>
          </div>
        ` : ''}

        <form onsubmit="goalForm.handleSubmit(event)">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              ${this.renderFormField('title', 'Goal Title', 'text', { placeholder: 'Enter your goal title' })}
              ${this.renderTextareaField('description', 'Description', 4)}
              ${this.renderSelectField('category', 'Category', categoryOptions)}
              ${this.renderTagsField()}
            </div>
            
            <div>
              ${this.renderSelectField('priority', 'Priority', priorityOptions)}
              ${this.renderSelectField('status', 'Status', statusOptions)}
              ${this.renderFormField('targetValue', 'Target Value', 'number', { min: 1, max: 1000000 })}
              ${this.renderFormField('currentProgress', 'Current Progress', 'number', { min: 0 })}
              ${this.renderFormField('deadline', 'Deadline', 'date')}
            </div>
          </div>

          <div class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div class="flex items-center space-x-3">
              ${this.props.mode === 'edit' && this.props.onDelete ? `
                <button type="button" 
                        onclick="goalForm.handleDelete()"
                        class="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Goal
                </button>
              ` : ''}
            </div>
            
            <div class="flex items-center space-x-3">
              <button type="button" 
                      onclick="goalForm.handleCancel()"
                      class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit" 
                      ${this.props.isLoading ? 'disabled' : ''}
                      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                ${this.props.isLoading ? `
                  <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                ` : `
                  ${this.props.mode === 'edit' ? 'Update Goal' : 'Create Goal'}
                `}
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  public updateProps(props: Partial<GoalFormProps>): void {
    this.props = { ...this.props, ...props };
    if (props.goal) {
      this.formData = this.initializeFormData();
      this.isDirty = false;
    }
    this.rerender();
  }

  public reset(): void {
    this.formData = this.initializeFormData();
    this.errors = {};
    this.isDirty = false;
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.rerender();
  }

  public static create(props: GoalFormProps): GoalForm {
    return new GoalForm(props);
  }
}

// Export for use in other components
export { GoalForm };
export type { GoalFormProps, FormData, ValidationErrors };
