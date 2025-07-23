import { formatDuration, formatTimerDisplay, formatDate, formatFileSize } from './helpers';

/**
 * Format number with thousand separators
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format progress percentage
 */
export const formatProgress = (current: number, target: number): string => {
  if (target === 0) return '0%';
  const percentage = Math.min((current / target) * 100, 100);
  return `${Math.round(percentage)}%`;
};

/**
 * Format goal status to display text
 */
export const formatGoalStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
};

/**
 * Format goal priority to display text
 */
export const formatGoalPriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent',
  };
  return priorityMap[priority] || priority;
};

/**
 * Format timer type to display text
 */
export const formatTimerType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'pomodoro': 'Pomodoro',
    'focus': 'Focus Session',
    'break': 'Short Break',
    'longbreak': 'Long Break',
  };
  return typeMap[type] || type;
};

/**
 * Format timer status to display text
 */
export const formatTimerStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'paused': 'Paused',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
};

/**
 * Format productivity rating
 */
export const formatProductivityRating = (rating: number): string => {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return `${stars} (${rating}/5)`;
};

/**
 * Format user role
 */
export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    'user': 'User',
    'admin': 'Administrator',
    'moderator': 'Moderator',
  };
  return roleMap[role] || role;
};

/**
 * Format notification type
 */
export const formatNotificationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'success': 'Success',
    'error': 'Error',
    'warning': 'Warning',
    'info': 'Information',
  };
  return typeMap[type] || type;
};

/**
 * Format theme mode
 */
export const formatThemeMode = (mode: string): string => {
  const modeMap: Record<string, string> = {
    'light': 'Light Mode',
    'dark': 'Dark Mode',
    'auto': 'Auto (System)',
  };
  return modeMap[mode] || mode;
};

/**
 * Format byte size to human readable
 */
export const formatBytes = formatFileSize;

/**
 * Format array as comma-separated list
 */
export const formatList = (items: string[], maxItems: number = 3): string => {
  if (items.length === 0) return '';
  if (items.length <= maxItems) {
    return items.join(', ');
  }
  return `${items.slice(0, maxItems).join(', ')} +${items.length - maxItems} more`;
};

/**
 * Format tags as comma-separated list with hash symbols
 */
export const formatTags = (tags: string[]): string => {
  return tags.map(tag => `#${tag}`).join(', ');
};

/**
 * Format milestone progress
 */
export const formatMilestoneProgress = (current: number, target: number, unit: string): string => {
  return `${current}/${target} ${unit}`;
};

/**
 * Format streak count
 */
export const formatStreak = (count: number): string => {
  if (count === 0) return 'No streak';
  if (count === 1) return '1 day streak';
  return `${count} days streak`;
};

/**
 * Format time range
 */
export const formatTimeRange = (startTime: string, endTime: string): string => {
  const start = formatDate(startTime, 'HH:mm');
  const end = formatDate(endTime, 'HH:mm');
  return `${start} - ${end}`;
};

/**
 * Format session duration with context
 */
export const formatSessionDuration = (duration: number, type: string): string => {
  const formattedDuration = formatDuration(duration);
  const typeText = formatTimerType(type);
  return `${formattedDuration} ${typeText}`;
};

/**
 * Format completion rate
 */
export const formatCompletionRate = (completed: number, total: number): string => {
  if (total === 0) return '0%';
  const rate = (completed / total) * 100;
  return `${Math.round(rate)}% (${completed}/${total})`;
};

/**
 * Format trend indicator
 */
export const formatTrend = (trend: 'up' | 'down' | 'stable'): string => {
  const trendMap: Record<string, string> = {
    'up': '↗️ Trending up',
    'down': '↘️ Trending down',
    'stable': '➡️ Stable',
  };
  return trendMap[trend] || trend;
};

/**
 * Format analytics period
 */
export const formatAnalyticsPeriod = (period: number): string => {
  if (period === 1) return 'Today';
  if (period === 7) return 'Last 7 days';
  if (period === 30) return 'Last 30 days';
  if (period === 90) return 'Last 3 months';
  if (period === 365) return 'Last year';
  return `Last ${period} days`;
};

/**
 * Format score or rating
 */
export const formatScore = (score: number, maxScore: number = 100): string => {
  const percentage = (score / maxScore) * 100;
  return `${score}/${maxScore} (${Math.round(percentage)}%)`;
};

/**
 * Format interval for repeat settings
 */
export const formatInterval = (interval: number, unit: string): string => {
  if (interval === 1) {
    return `Every ${unit.slice(0, -1)}`; // Remove 's' from plural
  }
  return `Every ${interval} ${unit}`;
};

/**
 * Format validation errors as a single string
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return `• ${errors.join('\n• ')}`;
};

/**
 * Format object as key-value pairs
 */
export const formatKeyValuePairs = (obj: Record<string, any>): string => {
  const pairs: string[] = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      pairs.push(`${key}: ${obj[key]}`);
    }
  }
  return pairs.join(', ');
};

/**
 * Format boolean as Yes/No
 */
export const formatBoolean = (value: boolean): string => {
  return value ? 'Yes' : 'No';
};

/**
 * Format optional value with fallback
 */
export const formatOptional = (value: any, fallback: string = 'Not set'): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
};

// Re-export commonly used formatters from helpers
export { 
  formatDuration, 
  formatTimerDisplay, 
  formatDate, 
  formatFileSize 
} from './helpers';
