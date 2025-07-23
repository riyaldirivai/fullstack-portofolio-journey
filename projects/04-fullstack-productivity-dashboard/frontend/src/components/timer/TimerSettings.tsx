/**
 * TimerSettings Component
 * 
 * Advanced settings and customization panel for Pomodoro timer
 * with presets, themes, notifications, and sound options
 */

import { PomodoroSettings } from './PomodoroTimer';

interface TimerSettingsProps {
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
  onResetToDefaults?: () => void;
  onExportSettings?: () => void;
  onImportSettings?: (settings: PomodoroSettings) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  settings: Partial<PomodoroSettings>;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  vibration: boolean;
  customSound?: string;
}

/**
 * TimerSettings - Comprehensive timer customization component
 */
class TimerSettings {
  private props: TimerSettingsProps;
  private settings: PomodoroSettings;
  private presets: SettingsPreset[];
  private activeTab: 'general' | 'notifications' | 'appearance' | 'advanced';
  private customSounds: { id: string; name: string; url: string }[];

  constructor(props: TimerSettingsProps) {
    this.props = {
      className: '',
      isOpen: true,
      ...props
    };
    
    this.settings = { ...props.settings };
    this.activeTab = 'general';
    
    this.presets = [
      {
        id: 'classic',
        name: 'Classic Pomodoro',
        description: 'Traditional 25/5/15 minute intervals',
        settings: {
          workDuration: 25,
          shortBreakDuration: 5,
          longBreakDuration: 15,
          sessionsUntilLongBreak: 4
        }
      },
      {
        id: 'extended',
        name: 'Extended Focus',
        description: 'Longer work sessions for deep work',
        settings: {
          workDuration: 50,
          shortBreakDuration: 10,
          longBreakDuration: 30,
          sessionsUntilLongBreak: 3
        }
      },
      {
        id: 'sprint',
        name: 'Quick Sprint',
        description: 'Short bursts for quick tasks',
        settings: {
          workDuration: 15,
          shortBreakDuration: 3,
          longBreakDuration: 10,
          sessionsUntilLongBreak: 6
        }
      },
      {
        id: 'custom',
        name: 'Custom Setup',
        description: 'Create your own timing preferences',
        settings: {}
      }
    ];

    this.customSounds = [
      { id: 'bell', name: 'Bell', url: '/sounds/bell.mp3' },
      { id: 'chime', name: 'Chime', url: '/sounds/chime.mp3' },
      { id: 'ding', name: 'Ding', url: '/sounds/ding.mp3' },
      { id: 'nature', name: 'Nature', url: '/sounds/nature.mp3' }
    ];
  }

  private handleSettingChange(key: keyof PomodoroSettings, value: any): void {
    (this.settings as any)[key] = value;
    this.props.onSettingsChange(this.settings);
    this.saveSettings();
    this.rerender();
  }

  private handlePresetSelection(presetId: string): void {
    const preset = this.presets.find(p => p.id === presetId);
    if (preset && preset.settings) {
      this.settings = { ...this.settings, ...preset.settings };
      this.props.onSettingsChange(this.settings);
      this.saveSettings();
      this.rerender();
    }
  }

  private handleTabChange(tab: typeof this.activeTab): void {
    this.activeTab = tab;
    this.rerender();
  }

  private handleResetToDefaults(): void {
    if (this.props.onResetToDefaults) {
      this.props.onResetToDefaults();
    }
    
    const defaultSettings: PomodoroSettings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'default'
    };
    
    this.settings = defaultSettings;
    this.props.onSettingsChange(this.settings);
    this.saveSettings();
    this.rerender();
  }

  private handleExportSettings(): void {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pomodoro-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  private handleImportSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        this.settings = { ...this.settings, ...importedSettings };
        this.props.onSettingsChange(this.settings);
        this.saveSettings();
        this.rerender();
      } catch (error) {
        alert('Invalid settings file format');
      }
    };
    reader.readAsText(file);
  }

  private saveSettings(): void {
    localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
  }

  private renderTabs(): string {
    const tabs = [
      { id: 'general', label: 'General', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-3.5-7L13 17h2zm-5.5 0H15l-2.5-5L9.5 17z' },
      { id: 'appearance', label: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z' },
      { id: 'advanced', label: 'Advanced', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4' }
    ];

    return `
      <div class="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
        ${tabs.map(tab => `
          <button onclick="timerSettings.handleTabChange('${tab.id}')"
                  class="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    this.activeTab === tab.id 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600'
                  }">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${tab.icon}" />
            </svg>
            ${tab.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  private renderPresets(): string {
    return `
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Presets</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this.presets.map(preset => `
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                 onclick="timerSettings.handlePresetSelection('${preset.id}')">
              <h4 class="font-medium text-gray-900 dark:text-white mb-1">${preset.name}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">${preset.description}</p>
              ${preset.settings.workDuration ? `
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  ${preset.settings.workDuration}min work / ${preset.settings.shortBreakDuration}min break
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private renderGeneralSettings(): string {
    return `
      <div class="space-y-6">
        ${this.renderPresets()}
        
        <!-- Time Durations -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time Settings</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Work Duration (minutes)
              </label>
              <input type="number" 
                     value="${this.settings.workDuration}"
                     min="1" max="120"
                     onchange="timerSettings.handleSettingChange('workDuration', parseInt(this.value))"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Break (minutes)
              </label>
              <input type="number" 
                     value="${this.settings.shortBreakDuration}"
                     min="1" max="60"
                     onchange="timerSettings.handleSettingChange('shortBreakDuration', parseInt(this.value))"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Long Break (minutes)
              </label>
              <input type="number" 
                     value="${this.settings.longBreakDuration}"
                     min="1" max="120"
                     onchange="timerSettings.handleSettingChange('longBreakDuration', parseInt(this.value))"
                     class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
          </div>
        </div>

        <!-- Sessions Settings -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Settings</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sessions until long break
              </label>
              <input type="number" 
                     value="${this.settings.sessionsUntilLongBreak}"
                     min="2" max="10"
                     onchange="timerSettings.handleSettingChange('sessionsUntilLongBreak', parseInt(this.value))"
                     class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" 
                     ${this.settings.autoStartBreaks ? 'checked' : ''}
                     onchange="timerSettings.handleSettingChange('autoStartBreaks', this.checked)"
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Automatically start breaks
              </label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" 
                     ${this.settings.autoStartWork ? 'checked' : ''}
                     onchange="timerSettings.handleSettingChange('autoStartWork', this.checked)"
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Automatically start work sessions after breaks
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderNotificationSettings(): string {
    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
          <div class="space-y-4">
            <div class="flex items-center">
              <input type="checkbox" 
                     ${this.settings.notificationsEnabled ? 'checked' : ''}
                     onchange="timerSettings.handleSettingChange('notificationsEnabled', this.checked)"
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Enable desktop notifications
              </label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" 
                     ${this.settings.soundEnabled ? 'checked' : ''}
                     onchange="timerSettings.handleSettingChange('soundEnabled', this.checked)"
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Enable sound notifications
              </label>
            </div>
          </div>
        </div>

        ${this.settings.soundEnabled ? `
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">Sound Options</h4>
            <div class="space-y-2">
              ${this.customSounds.map(sound => `
                <div class="flex items-center">
                  <input type="radio" 
                         name="notificationSound"
                         value="${sound.id}"
                         class="mr-3 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <label class="text-sm text-gray-700 dark:text-gray-300">${sound.name}</label>
                  <button onclick="timerSettings.playSound('${sound.url}')"
                          class="ml-auto text-blue-600 hover:text-blue-800 text-sm">
                    Preview
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Notification Test -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">Test Notifications</h4>
          <p class="text-sm text-blue-700 dark:text-blue-200 mb-3">
            Make sure your notifications are working properly
          </p>
          <button onclick="timerSettings.testNotification()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Send Test Notification
          </button>
        </div>
      </div>
    `;
  }

  private renderAppearanceSettings(): string {
    const themes = [
      { id: 'default', name: 'Default', description: 'Clean and minimal design' },
      { id: 'dark', name: 'Dark', description: 'Dark theme for low-light environments' },
      { id: 'minimal', name: 'Minimal', description: 'Distraction-free interface' }
    ];

    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Selection</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${themes.map(theme => `
              <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer transition-colors ${
                this.settings.theme === theme.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }"
                   onclick="timerSettings.handleSettingChange('theme', '${theme.id}')">
                <h4 class="font-medium text-gray-900 dark:text-white mb-1">${theme.name}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">${theme.description}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Color Customization -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Preferences</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Work Session Color
              </label>
              <input type="color" 
                     value="#dc2626"
                     class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Break Color
              </label>
              <input type="color" 
                     value="#16a34a"
                     class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accent Color
              </label>
              <input type="color" 
                     value="#2563eb"
                     class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderAdvancedSettings(): string {
    return `
      <div class="space-y-6">
        <!-- Data Management -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">Export Settings</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Download your current settings as a file</p>
              </div>
              <button onclick="timerSettings.handleExportSettings()"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Export
              </button>
            </div>

            <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">Import Settings</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Load settings from a previously exported file</p>
              </div>
              <label class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                Import
                <input type="file" 
                       accept=".json"
                       onchange="timerSettings.handleImportSettings(event)"
                       class="hidden" />
              </label>
            </div>

            <div class="flex items-center justify-between p-4 border border-red-200 dark:border-red-600 rounded-lg bg-red-50 dark:bg-red-900">
              <div>
                <h4 class="font-medium text-red-900 dark:text-red-100">Reset to Defaults</h4>
                <p class="text-sm text-red-700 dark:text-red-200">Restore all settings to their default values</p>
              </div>
              <button onclick="timerSettings.handleResetToDefaults()"
                      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Performance Settings -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
          <div class="space-y-4">
            <div class="flex items-center">
              <input type="checkbox" 
                     checked
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Enable background processing
              </label>
            </div>
            
            <div class="flex items-center">
              <input type="checkbox" 
                     checked
                     class="mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <label class="text-sm text-gray-700 dark:text-gray-300">
                Auto-save session data
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private playSound(url: string): void {
    const audio = new Audio(url);
    audio.play().catch(() => {
      console.warn('Could not play sound preview');
    });
  }

  private testNotification(): void {
    if ('Notification' in window) {
      new Notification('Pomodoro Timer', {
        body: 'This is a test notification. Your notifications are working!',
        icon: '/favicon.ico'
      });
    } else {
      alert('Notifications are not supported in this browser');
    }
  }

  private rerender(): void {
    const container = document.getElementById('timerSettingsContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).timerSettings = this;

    if (!this.props.isOpen) return '';

    return `
      <div id="timerSettingsContainer" class="timer-settings ${this.props.className}">
        <!-- Modal Overlay -->
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Timer Settings</h2>
              ${this.props.onClose ? `
                <button onclick="timerSettings.props.onClose()"
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ` : ''}
            </div>

            <!-- Content -->
            <div class="flex flex-col lg:flex-row h-full max-h-[calc(90vh-80px)]">
              <!-- Sidebar -->
              <div class="lg:w-64 border-r border-gray-200 dark:border-gray-700 p-6">
                ${this.renderTabs()}
              </div>

              <!-- Main Content -->
              <div class="flex-1 p-6 overflow-y-auto">
                ${this.activeTab === 'general' ? this.renderGeneralSettings() : ''}
                ${this.activeTab === 'notifications' ? this.renderNotificationSettings() : ''}
                ${this.activeTab === 'appearance' ? this.renderAppearanceSettings() : ''}
                ${this.activeTab === 'advanced' ? this.renderAdvancedSettings() : ''}
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Settings are automatically saved
              </div>
              <div class="flex items-center space-x-3">
                ${this.props.onClose ? `
                  <button onclick="timerSettings.props.onClose()"
                          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                    Close
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  public updateSettings(settings: PomodoroSettings): void {
    this.settings = { ...settings };
    this.rerender();
  }

  public static create(props: TimerSettingsProps): TimerSettings {
    return new TimerSettings(props);
  }
}

// Export for use in other components
export { TimerSettings };
export type { TimerSettingsProps, SettingsPreset, NotificationSettings };
