import { VALIDATION_RULES } from './constants';

// Email validation
export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL_PATTERN.test(email);
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Username validation
export const validateUsername = (username: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (username.length < VALIDATION_RULES.USERNAME_MIN_LENGTH) {
    errors.push(`Username must be at least ${VALIDATION_RULES.USERNAME_MIN_LENGTH} characters long`);
  }
  
  if (username.length > VALIDATION_RULES.USERNAME_MAX_LENGTH) {
    errors.push(`Username must be no more than ${VALIDATION_RULES.USERNAME_MAX_LENGTH} characters long`);
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
    errors.push('Username cannot start or end with underscore or hyphen');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Required field validation
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

// String length validation
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): string | null => {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  if (value.length > max) {
    return `${fieldName} must be no more than ${max} characters long`;
  }
  return null;
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Number validation
export const validateNumber = (
  value: number,
  min?: number,
  max?: number,
  fieldName: string = 'Value'
): string | null => {
  if (isNaN(value)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && value > max) {
    return `${fieldName} must be no more than ${max}`;
  }
  
  return null;
};

// Date validation
export const validateDate = (date: string | Date, fieldName: string = 'Date'): string | null => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  return null;
};

// Future date validation
export const validateFutureDate = (date: string | Date, fieldName: string = 'Date'): string | null => {
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (dateObj <= now) {
    return `${fieldName} must be in the future`;
  }
  
  return null;
};

// Phone number validation (basic)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s|-|\(|\)/g, ''));
};

// File validation
export const validateFile = (
  file: File,
  maxSize: number,
  allowedTypes: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  if (allowedTypes.indexOf(file.type) === -1) {
    errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Goal validation
export const validateGoal = (goal: {
  title: string;
  description?: string;
  targetDate?: string;
  progress?: { target: number; unit: string };
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Title validation
  const titleError = validateRequired(goal.title, 'Title');
  if (titleError) {
    errors.title = titleError;
  } else {
    const lengthError = validateLength(goal.title, 1, VALIDATION_RULES.GOAL_TITLE_MAX_LENGTH, 'Title');
    if (lengthError) errors.title = lengthError;
  }
  
  // Description validation
  if (goal.description) {
    const descError = validateLength(
      goal.description,
      0,
      VALIDATION_RULES.GOAL_DESCRIPTION_MAX_LENGTH,
      'Description'
    );
    if (descError) errors.description = descError;
  }
  
  // Target date validation
  if (goal.targetDate) {
    const dateError = validateFutureDate(goal.targetDate, 'Target date');
    if (dateError) errors.targetDate = dateError;
  }
  
  // Progress target validation
  if (goal.progress) {
    const targetError = validateNumber(goal.progress.target, 1, undefined, 'Target');
    if (targetError) errors.progressTarget = targetError;
    
    if (!goal.progress.unit || goal.progress.unit.trim() === '') {
      errors.progressUnit = 'Progress unit is required';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Timer validation
export const validateTimerDuration = (duration: number): string | null => {
  const minDuration = 1 * 60 * 1000; // 1 minute
  const maxDuration = 4 * 60 * 60 * 1000; // 4 hours
  
  return validateNumber(duration, minDuration, maxDuration, 'Timer duration');
};

// Form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => string | null>
): { isValid: boolean; errors: Record<keyof T, string> } => {
  const errors: Record<keyof T, string> = {} as Record<keyof T, string>;
  
  for (const field in rules) {
    const error = rules[field](data[field]);
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Sanitize input (basic XSS prevention)
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate password match
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
};

// Validate hex color
export const validateHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// Validate array not empty
export const validateArrayNotEmpty = <T>(array: T[], fieldName: string): string | null => {
  if (!Array.isArray(array) || array.length === 0) {
    return `${fieldName} must contain at least one item`;
  }
  return null;
};
