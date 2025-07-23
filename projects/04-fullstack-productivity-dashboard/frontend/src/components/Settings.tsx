/**
 * Settings Component
 * 
 * Comprehensive settings management for user preferences,
 * notifications, appearance, account settings, and system configuration
 */

interface SettingsProps {
  userId: string;
  onSettingsChange?: (settings: UserSettings) => void;
  onPasswordChange?: (success: boolean) => void;
  onAccountDelete?: () => void;
  className?: string;
  showAdvanced?: boolean;
}

interface UserSettings {
  // General Preferences
  general: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStartDay: number; // 0 = Sunday, 1 = Monday
  };

  // Appearance
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    colorScheme: 'blue' | 'green' | 'purple' | 'red' | 'orange';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    animations: boolean;
  };

  // Notifications
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    goalReminders: boolean;
    timerNotifications: boolean;
    achievementAlerts: boolean;
    weeklyReports: boolean;
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };

  // Privacy & Security
  privacy: {
    profileVisibility: 'public' | 'private' | 'friends';
    dataSharing: boolean;
    analytics: boolean;
    crashReports: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number; // minutes
  };

  // Productivity
  productivity: {
    defaultPomodoroLength: number;
    defaultBreakLength: number;
    longBreakLength: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;
    soundVolume: number;
    focusMode: boolean;
  };

  // Data & Backup
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    retentionPeriod: number; // days
    exportFormat: 'json' | 'csv' | 'pdf';
    cloudSync: boolean;
  };
}

interface AccountInfo {
  email: string;
  displayName: string;
  avatar?: string;
  joinDate: string;
  lastActive: string;
  storageUsed: number;
  storageLimit: number;
  plan: 'free' | 'premium' | 'enterprise';
}

/**
 * Settings - Comprehensive settings management component
 */
class Settings {
  private props: SettingsProps;
  private settings: UserSettings;
  private accountInfo: AccountInfo | null;
  private activeTab: string;
  private isLoading: boolean;
  private isSaving: boolean;
  private error: string | null;
  private successMessage: string | null;
  private pendingChanges: boolean;

  constructor(props: SettingsProps) {
    this.props = {
      className: '',
      showAdvanced: false,
      ...props
    };
    
    this.settings = this.getDefaultSettings();
    this.accountInfo = null;
    this.activeTab = 'general';
    this.isLoading = false;
    this.isSaving = false;
    this.error = null;
    this.successMessage = null;
    this.pendingChanges = false;

    this.loadSettings();
    this.loadAccountInfo();
  }

  private getDefaultSettings(): UserSettings {
    return {
      general: {
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        weekStartDay: 1
      },
      appearance: {
        theme: 'auto',
        colorScheme: 'blue',
        fontSize: 'medium',
        compactMode: false,
        animations: true
      },
      notifications: {
        email: true,
        push: true,
        desktop: true,
        goalReminders: true,
        timerNotifications: true,
        achievementAlerts: true,
        weeklyReports: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      },
      privacy: {
        profileVisibility: 'private',
        dataSharing: false,
        analytics: true,
        crashReports: true,
        twoFactorAuth: false,
        sessionTimeout: 60
      },
      productivity: {
        defaultPomodoroLength: 25,
        defaultBreakLength: 5,
        longBreakLength: 15,
        autoStartBreaks: false,
        autoStartPomodoros: false,
        soundEnabled: true,
        soundVolume: 50,
        focusMode: false
      },
      data: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionPeriod: 90,
        exportFormat: 'json',
        cloudSync: true
      }
    };
  }

  private async loadSettings(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    this.rerender();

    try {
      const response = await fetch(`/api/users/${this.props.userId}/settings`);
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      this.settings = { ...this.settings, ...data };
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error occurred';
      this.isLoading = false;
    }
    
    this.rerender();
  }

  private async loadAccountInfo(): Promise<void> {
    try {
      const response = await fetch(`/api/users/${this.props.userId}/account`);
      if (!response.ok) {
        throw new Error('Failed to load account info');
      }
      
      const data = await response.json();
      this.accountInfo = data;
    } catch (error) {
      // Use mock data for demo
      this.accountInfo = {
        email: 'user@example.com',
        displayName: 'John Doe',
        avatar: '',
        joinDate: '2024-01-15',
        lastActive: new Date().toISOString(),
        storageUsed: 2.5, // GB
        storageLimit: 10, // GB
        plan: 'premium'
      };
    }
    
    this.rerender();
  }

  private async saveSettings(): Promise<void> {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;
    this.rerender();

    try {
      const response = await fetch(`/api/users/${this.props.userId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      this.successMessage = 'Settings saved successfully!';
      this.pendingChanges = false;
      
      if (this.props.onSettingsChange) {
        this.props.onSettingsChange(this.settings);
      }
      
      setTimeout(() => {
        this.successMessage = null;
        this.rerender();
      }, 3000);

    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to save settings';
    }

    this.isSaving = false;
    this.rerender();
  }

  private updateSetting(section: keyof UserSettings, key: string, value: any): void {
    this.settings = {
      ...this.settings,
      [section]: {
        ...this.settings[section],
        [key]: value
      }
    };
    this.pendingChanges = true;
    this.rerender();
  }

  private handleTabChange(tab: string): void {
    this.activeTab = tab;
    this.rerender();
  }

  private async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`/api/users/${this.props.userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      this.successMessage = 'Password changed successfully!';
      
      if (this.props.onPasswordChange) {
        this.props.onPasswordChange(true);
      }

    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to change password';
      
      if (this.props.onPasswordChange) {
        this.props.onPasswordChange(false);
      }
    }

    this.rerender();
  }

  private async exportData(): Promise<void> {
    try {
      const response = await fetch(`/api/users/${this.props.userId}/export?format=${this.settings.data.exportFormat}`);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `productivity-data-${new Date().toISOString().split('T')[0]}.${this.settings.data.exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      this.successMessage = 'Data exported successfully!';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to export data';
    }

    this.rerender();
  }

  private renderTabNavigation(): string {
    const tabs = [
      { id: 'general', label: 'General', icon: '⚙️' },
      { id: 'appearance', label: 'Appearance', icon: '🎨' },
      { id: 'notifications', label: 'Notifications', icon: '🔔' },
      { id: 'privacy', label: 'Privacy', icon: '🔒' },
      { id: 'productivity', label: 'Productivity', icon: '⏱️' },
      { id: 'data', label: 'Data & Backup', icon: '💾' },
      { id: 'account', label: 'Account', icon: '👤' }
    ];

    return `
      <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav class="flex space-x-8 overflow-x-auto">
          ${tabs.map(tab => `
            <button onclick="settings.handleTabChange('${tab.id}')"
                    class="flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      this.activeTab === tab.id 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    } transition-colors">
              <span>${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `).join('')}
        </nav>
      </div>
    `;
  }

  private renderGeneralSettings(): string {
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">General Preferences</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
            <select onchange="settings.updateSetting('general', 'language', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="en" ${this.settings.general.language === 'en' ? 'selected' : ''}>English</option>
              <option value="es" ${this.settings.general.language === 'es' ? 'selected' : ''}>Spanish</option>
              <option value="fr" ${this.settings.general.language === 'fr' ? 'selected' : ''}>French</option>
              <option value="de" ${this.settings.general.language === 'de' ? 'selected' : ''}>German</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
            <select onchange="settings.updateSetting('general', 'timezone', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="UTC" ${this.settings.general.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
              <option value="America/New_York" ${this.settings.general.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
              <option value="America/Chicago" ${this.settings.general.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
              <option value="America/Los_Angeles" ${this.settings.general.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
            <select onchange="settings.updateSetting('general', 'dateFormat', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="MM/DD/YYYY" ${this.settings.general.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
              <option value="DD/MM/YYYY" ${this.settings.general.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
              <option value="YYYY-MM-DD" ${this.settings.general.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Format</label>
            <select onchange="settings.updateSetting('general', 'timeFormat', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="12h" ${this.settings.general.timeFormat === '12h' ? 'selected' : ''}>12-hour</option>
              <option value="24h" ${this.settings.general.timeFormat === '24h' ? 'selected' : ''}>24-hour</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private renderAppearanceSettings(): string {
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
            <div class="space-y-2">
              ${['light', 'dark', 'auto'].map(theme => `
                <label class="flex items-center">
                  <input type="radio" name="theme" value="${theme}"
                         ${this.settings.appearance.theme === theme ? 'checked' : ''}
                         onchange="settings.updateSetting('appearance', 'theme', this.value)"
                         class="mr-2 text-blue-600 focus:ring-blue-500">
                  <span class="text-sm text-gray-700 dark:text-gray-300">${theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color Scheme</label>
            <div class="flex space-x-2">
              ${['blue', 'green', 'purple', 'red', 'orange'].map(color => `
                <button onclick="settings.updateSetting('appearance', 'colorScheme', '${color}')"
                        class="w-8 h-8 rounded-full bg-${color}-500 ${this.settings.appearance.colorScheme === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''} hover:scale-110 transition-transform">
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Font Size</label>
            <select onchange="settings.updateSetting('appearance', 'fontSize', this.value)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="small" ${this.settings.appearance.fontSize === 'small' ? 'selected' : ''}>Small</option>
              <option value="medium" ${this.settings.appearance.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="large" ${this.settings.appearance.fontSize === 'large' ? 'selected' : ''}>Large</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center">
            <input type="checkbox" ${this.settings.appearance.compactMode ? 'checked' : ''}
                   onchange="settings.updateSetting('appearance', 'compactMode', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Compact mode</span>
          </label>

          <label class="flex items-center">
            <input type="checkbox" ${this.settings.appearance.animations ? 'checked' : ''}
                   onchange="settings.updateSetting('appearance', 'animations', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Enable animations</span>
          </label>
        </div>
      </div>
    `;
  }

  private renderNotificationSettings(): string {
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Notifications</h3>
        
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.email ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'email', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">📧 Email notifications</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.push ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'push', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">📱 Push notifications</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.desktop ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'desktop', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">💻 Desktop notifications</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.goalReminders ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'goalReminders', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">🎯 Goal reminders</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.timerNotifications ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'timerNotifications', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">⏰ Timer notifications</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.achievementAlerts ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'achievementAlerts', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">🏆 Achievement alerts</span>
            </label>

            <label class="flex items-center">
              <input type="checkbox" ${this.settings.notifications.weeklyReports ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'weeklyReports', this.checked)"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm text-gray-700 dark:text-gray-300">📊 Weekly reports</span>
            </label>
          </div>

          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label class="flex items-center mb-4">
              <input type="checkbox" ${this.settings.notifications.quietHours.enabled ? 'checked' : ''}
                     onchange="settings.updateSetting('notifications', 'quietHours', {...settings.settings.notifications.quietHours, enabled: this.checked})"
                     class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">🌙 Quiet hours</span>
            </label>

            ${this.settings.notifications.quietHours.enabled ? `
              <div class="ml-6 grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start time</label>
                  <input type="time" value="${this.settings.notifications.quietHours.start}"
                         onchange="settings.updateSetting('notifications', 'quietHours', {...settings.settings.notifications.quietHours, start: this.value})"
                         class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                </div>
                <div>
                  <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">End time</label>
                  <input type="time" value="${this.settings.notifications.quietHours.end}"
                         onchange="settings.updateSetting('notifications', 'quietHours', {...settings.settings.notifications.quietHours, end: this.value})"
                         class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private renderProductivitySettings(): string {
    return `
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Productivity Settings</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pomodoro Length (minutes)</label>
            <input type="number" min="15" max="60" value="${this.settings.productivity.defaultPomodoroLength}"
                   onchange="settings.updateSetting('productivity', 'defaultPomodoroLength', parseInt(this.value))"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Break Length (minutes)</label>
            <input type="number" min="3" max="15" value="${this.settings.productivity.defaultBreakLength}"
                   onchange="settings.updateSetting('productivity', 'defaultBreakLength', parseInt(this.value))"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Long Break Length (minutes)</label>
            <input type="number" min="15" max="30" value="${this.settings.productivity.longBreakLength}"
                   onchange="settings.updateSetting('productivity', 'longBreakLength', parseInt(this.value))"
                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sound Volume (%)</label>
            <input type="range" min="0" max="100" value="${this.settings.productivity.soundVolume}"
                   onchange="settings.updateSetting('productivity', 'soundVolume', parseInt(this.value))"
                   class="w-full">
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">${this.settings.productivity.soundVolume}%</div>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center">
            <input type="checkbox" ${this.settings.productivity.autoStartBreaks ? 'checked' : ''}
                   onchange="settings.updateSetting('productivity', 'autoStartBreaks', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Auto-start breaks</span>
          </label>

          <label class="flex items-center">
            <input type="checkbox" ${this.settings.productivity.autoStartPomodoros ? 'checked' : ''}
                   onchange="settings.updateSetting('productivity', 'autoStartPomodoros', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Auto-start pomodoros</span>
          </label>

          <label class="flex items-center">
            <input type="checkbox" ${this.settings.productivity.soundEnabled ? 'checked' : ''}
                   onchange="settings.updateSetting('productivity', 'soundEnabled', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Enable sound notifications</span>
          </label>

          <label class="flex items-center">
            <input type="checkbox" ${this.settings.productivity.focusMode ? 'checked' : ''}
                   onchange="settings.updateSetting('productivity', 'focusMode', this.checked)"
                   class="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">Focus mode (minimal distractions)</span>
          </label>
        </div>
      </div>
    `;
  }

  private renderAccountSettings(): string {
    if (!this.accountInfo) return '';

    return `
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
        
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              ${this.accountInfo.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">${this.accountInfo.displayName}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">${this.accountInfo.email}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ${this.accountInfo.plan.charAt(0).toUpperCase() + this.accountInfo.plan.slice(1)} Plan
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Member since</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">${new Date(this.accountInfo.joinDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Last active</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">${new Date(this.accountInfo.lastActive).toLocaleDateString()}</p>
            </div>
            <div class="md:col-span-2">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Storage usage</p>
              <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${(this.accountInfo.storageUsed / this.accountInfo.storageLimit) * 100}%"></div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ${this.accountInfo.storageUsed} GB / ${this.accountInfo.storageLimit} GB used
              </p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">Security Actions</h4>
          <div class="space-y-3">
            <button onclick="settings.showPasswordChangeModal()"
                    class="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Change Password
            </button>
            <button onclick="settings.exportData()"
                    class="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-0 md:ml-3">
              Export Data
            </button>
            <button onclick="settings.showDeleteAccountModal()"
                    class="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-0 md:ml-3">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderTabContent(): string {
    switch (this.activeTab) {
      case 'general':
        return this.renderGeneralSettings();
      case 'appearance':
        return this.renderAppearanceSettings();
      case 'notifications':
        return this.renderNotificationSettings();
      case 'privacy':
        return `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Privacy settings coming soon...</div>`;
      case 'productivity':
        return this.renderProductivitySettings();
      case 'data':
        return `<div class="text-center py-8 text-gray-500 dark:text-gray-400">Data & backup settings coming soon...</div>`;
      case 'account':
        return this.renderAccountSettings();
      default:
        return this.renderGeneralSettings();
    }
  }

  private renderSaveButton(): string {
    if (!this.pendingChanges) return '';

    return `
      <div class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 mt-6">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600 dark:text-gray-400">You have unsaved changes</p>
          <div class="space-x-3">
            <button onclick="settings.loadSettings()"
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onclick="settings.saveSettings()"
                    ${this.isSaving ? 'disabled' : ''}
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              ${this.isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderNotifications(): string {
    if (!this.error && !this.successMessage) return '';

    return `
      <div class="mb-6">
        ${this.error ? `
          <div class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <div class="flex">
              <span class="text-red-400 mr-2">⚠️</span>
              <span>${this.error}</span>
            </div>
          </div>
        ` : ''}
        
        ${this.successMessage ? `
          <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <div class="flex">
              <span class="text-green-400 mr-2">✅</span>
              <span>${this.successMessage}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('settingsContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).settings = this;

    return `
      <div id="settingsContainer" class="settings ${this.props.className}">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-6">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
              <p class="text-gray-600 dark:text-gray-400 mb-6">Manage your account settings and preferences</p>
              
              ${this.renderNotifications()}
              ${this.renderTabNavigation()}
              
              <div class="tab-content">
                ${this.isLoading ? `
                  <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p class="text-gray-600 dark:text-gray-400 mt-4">Loading settings...</p>
                  </div>
                ` : this.renderTabContent()}
              </div>
            </div>
            
            ${this.renderSaveButton()}
          </div>
        </div>
      </div>
    `;
  }

  public static create(props: SettingsProps): Settings {
    return new Settings(props);
  }
}

// Export for use in other components
export { Settings };
export type { SettingsProps, UserSettings, AccountInfo };
