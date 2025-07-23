export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate?: string;
  createdDate: string;
  completedDate?: string;
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  milestones: Milestone[];
  tags: string[];
  isPublic: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completedDate?: string;
  isCompleted: boolean;
  progress: {
    current: number;
    target: number;
    unit: string;
  };
  order: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  userId?: string;
  createdAt: string;
}

export interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  onHold: number;
  cancelled: number;
  completionRate: number;
  averageCompletionTime: number;
  byCategory: Array<{
    category: string;
    count: number;
    completed: number;
  }>;
  byPriority: Array<{
    priority: GoalPriority;
    count: number;
    completed: number;
  }>;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category: string;
  priority: GoalPriority;
  targetDate?: string;
  progress: {
    target: number;
    unit: string;
  };
  milestones?: Omit<Milestone, 'id' | 'isCompleted' | 'completedDate'>[];
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  category?: string;
  priority?: GoalPriority;
  targetDate?: string;
  status?: GoalStatus;
  progress?: {
    current?: number;
    target?: number;
    unit?: string;
  };
  milestones?: Omit<Milestone, 'id' | 'isCompleted' | 'completedDate'>[];
  tags?: string[];
  isPublic?: boolean;
}

export interface GoalFilters {
  status?: GoalStatus[];
  category?: string[];
  priority?: GoalPriority[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface GoalSortOptions {
  field: 'title' | 'createdDate' | 'targetDate' | 'priority' | 'progress';
  direction: 'asc' | 'desc';
}

export interface GoalsState {
  goals: Goal[];
  categories: Category[];
  stats: GoalStats | null;
  filters: GoalFilters;
  sortOptions: GoalSortOptions;
  currentGoal: Goal | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
