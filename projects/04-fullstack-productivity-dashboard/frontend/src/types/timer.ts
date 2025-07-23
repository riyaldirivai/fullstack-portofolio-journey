export type TimerType = 'pomodoro' | 'focus' | 'break' | 'longbreak';
export type TimerStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface TimerSession {
  id: string;
  type: TimerType;
  taskName?: string;
  duration: number; // in milliseconds
  elapsedTime: number; // in milliseconds
  startTime: string;
  endTime?: string;
  status: TimerStatus;
  goalId?: string;
  notes?: string;
  productivity?: {
    rating: number; // 1-5
    feedback?: string;
  };
  interruptions: Interruption[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interruption {
  id: string;
  reason: string;
  duration: number; // in milliseconds
  timestamp: string;
}

export interface TimerPresets {
  pomodoro: number; // 25 minutes in milliseconds
  focus: number; // 50 minutes in milliseconds
  break: number; // 5 minutes in milliseconds
  longbreak: number; // 15 minutes in milliseconds
}

export interface TimerSettings {
  presets: TimerPresets;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  notifications: {
    sound: boolean;
    desktop: boolean;
    volume: number; // 0-100
  };
  goals: {
    dailySessions: number;
    dailyTime: number; // in milliseconds
  };
}

export interface TimerStats {
  byType: Array<{
    _id: TimerType;
    totalSessions: number;
    totalTime: number;
    averageTime: number;
    completedSessions: number;
    averageProductivity?: number;
  }>;
  total: {
    totalSessions: number;
    totalTime: number;
    completedSessions: number;
    averageSessionTime: number;
    averageProductivity?: number;
  };
  trends: Array<{
    date: string;
    sessions: number;
    time: number;
    productivity?: number;
  }>;
  streaks: {
    current: number;
    longest: number;
    average: number;
  };
}

export interface CreateTimerData {
  type: TimerType;
  duration: number;
  goalId?: string;
  taskName?: string;
}

export interface UpdateTimerData {
  notes?: string;
  productivity?: {
    rating: number;
    feedback?: string;
  };
}

export interface AddInterruptionData {
  reason: string;
  duration: number;
}

export interface TimerState {
  activeSession: TimerSession | null;
  sessions: TimerSession[];
  stats: TimerStats | null;
  settings: TimerSettings;
  isLoading: boolean;
  error: string | null;
  // Client-side timer state
  isRunning: boolean;
  currentTime: number; // in milliseconds
  sessionStartTime: number | null;
  pausedTime: number; // accumulated paused time
  lastUpdateTime: number;
}

export interface TimerFilters {
  type?: TimerType[];
  status?: TimerStatus[];
  goalId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface TimerSortOptions {
  field: 'startTime' | 'duration' | 'type' | 'productivity';
  direction: 'asc' | 'desc';
}
