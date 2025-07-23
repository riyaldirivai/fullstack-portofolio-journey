import { STORAGE_KEYS } from './constants';

/**
 * Safe localStorage operations with error handling
 */
class LocalStorageService {
  /**
   * Check if localStorage is available
   */
  private isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get item from localStorage
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) {
      return defaultValue || null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue || null;
    }
  }

  /**
   * Set item in localStorage
   */
  setItem<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get all keys from localStorage
   */
  getAllKeys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      console.warn('Error getting localStorage keys:', error);
      return [];
    }
  }

  /**
   * Check if key exists in localStorage
   */
  hasItem(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  }

  /**
   * Get storage size in bytes (approximate)
   */
  getStorageSize(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    let total = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += key.length + (localStorage[key]?.length || 0);
        }
      }
    } catch (error) {
      console.warn('Error calculating localStorage size:', error);
    }
    
    return total;
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

// Specific helper functions for common operations
export const getAuthToken = (): string | null => {
  return localStorageService.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
};

export const setAuthToken = (token: string): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const removeAuthToken = (): boolean => {
  return localStorageService.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const getRefreshToken = (): string | null => {
  return localStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
};

export const setRefreshToken = (token: string): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const removeRefreshToken = (): boolean => {
  return localStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const getUserPreferences = (): any => {
  return localStorageService.getItem(STORAGE_KEYS.USER_PREFERENCES, {});
};

export const setUserPreferences = (preferences: any): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
};

export const getTimerSettings = (): any => {
  return localStorageService.getItem(STORAGE_KEYS.TIMER_SETTINGS, {});
};

export const setTimerSettings = (settings: any): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.TIMER_SETTINGS, settings);
};

export const getTheme = (): string => {
  return localStorageService.getItem<string>(STORAGE_KEYS.THEME, 'light') || 'light';
};

export const setTheme = (theme: string): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.THEME, theme);
};

export const getLanguage = (): string => {
  return localStorageService.getItem<string>(STORAGE_KEYS.LANGUAGE, 'en') || 'en';
};

export const setLanguage = (language: string): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.LANGUAGE, language);
};

export const isOnboardingCompleted = (): boolean => {
  return localStorageService.getItem<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED, false) || false;
};

export const setOnboardingCompleted = (completed: boolean): boolean => {
  return localStorageService.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed);
};

export const clearAuthData = (): void => {
  removeAuthToken();
  removeRefreshToken();
};

export const clearAllUserData = (): void => {
  clearAuthData();
  localStorageService.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  localStorageService.removeItem(STORAGE_KEYS.TIMER_SETTINGS);
  localStorageService.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
};

// Export the service instance for advanced usage
export default localStorageService;
