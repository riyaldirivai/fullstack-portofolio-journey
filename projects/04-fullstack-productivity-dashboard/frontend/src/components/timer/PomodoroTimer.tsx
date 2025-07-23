/**
 * PomodoroTimer Component
 * 
 * Advanced Pomodoro timer with sessions, breaks, notifications,
 * and integration with goal tracking
 */

interface PomodoroTimerProps {
  onSessionComplete?: (session: TimerSession) => void;
  onSessionStart?: (session: TimerSession) => void;
  onSessionPause?: (session: TimerSession) => void;
  onSessionStop?: (session: TimerSession) => void;
  settings?: PomodoroSettings;
  goalId?: string;
  className?: string;
  autoStart?: boolean;
}

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: 'default' | 'dark' | 'minimal';
}

interface TimerSession {
  id: string;
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // in seconds
  remainingTime: number; // in seconds
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  startTime?: string;
  endTime?: string;
  goalId?: string;
  notes?: string;
}

interface TimerStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number; // in minutes
  longestStreak: number;
  currentStreak: number;
}

/**
 * PomodoroTimer - Advanced pomodoro timer with analytics
 */
class PomodoroTimer {
  private props: PomodoroTimerProps;
  private settings: PomodoroSettings;
  private currentSession: TimerSession | null;
  private sessionCount: number;
  private completedSessions: number;
  private intervalId: number | null;
  private audioContext: AudioContext | null;
  private isNotificationPermissionGranted: boolean;

  constructor(props: PomodoroTimerProps) {
    this.props = {
      autoStart: false,
      className: '',
      ...props
    };
    
    this.settings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartBreaks: false,
      autoStartWork: false,
      soundEnabled: true,
      notificationsEnabled: true,
      theme: 'default',
      ...props.settings
    };
    
    this.currentSession = null;
    this.sessionCount = 0;
    this.completedSessions = 0;
    this.intervalId = null;
    this.audioContext = null;
    this.isNotificationPermissionGranted = false;
    
    this.initializePermissions();
    this.loadSessionData();
    
    if (this.props.autoStart) {
      this.startWorkSession();
    }
  }

  private async initializePermissions(): Promise<void> {
    // Request notification permission
    if ('Notification' in window && this.settings.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      this.isNotificationPermissionGranted = permission === 'granted';
    }
    
    // Initialize audio context for sound notifications
    if (this.settings.soundEnabled) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported');
      }
    }
  }

  private loadSessionData(): void {
    const saved = localStorage.getItem('pomodoroTimerData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.sessionCount = data.sessionCount || 0;
        this.completedSessions = data.completedSessions || 0;
        if (data.currentSession && data.currentSession.status === 'running') {
          // Resume interrupted session
          this.currentSession = data.currentSession;
          this.startTimer();
        }
      } catch (error) {
        console.warn('Failed to load timer data');
      }
    }
  }

  private saveSessionData(): void {
    const data = {
      sessionCount: this.sessionCount,
      completedSessions: this.completedSessions,
      currentSession: this.currentSession
    };
    localStorage.setItem('pomodoroTimerData', JSON.stringify(data));
  }

  private createSession(type: 'work' | 'shortBreak' | 'longBreak'): TimerSession {
    let duration: number;
    switch (type) {
      case 'work':
        duration = this.settings.workDuration * 60;
        break;
      case 'shortBreak':
        duration = this.settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        duration = this.settings.longBreakDuration * 60;
        break;
    }

    return {
      id: `session_${Date.now()}`,
      type,
      duration,
      remainingTime: duration,
      status: 'idle',
      goalId: this.props.goalId
    };
  }

  private startWorkSession(): void {
    this.currentSession = this.createSession('work');
    this.sessionCount++;
    this.startSession();
  }

  private startBreakSession(): void {
    const isLongBreak = this.completedSessions > 0 && 
                       this.completedSessions % this.settings.sessionsUntilLongBreak === 0;
    const breakType = isLongBreak ? 'longBreak' : 'shortBreak';
    this.currentSession = this.createSession(breakType);
    this.startSession();
  }

  private startSession(): void {
    if (!this.currentSession) return;
    
    this.currentSession.status = 'running';
    this.currentSession.startTime = new Date().toISOString();
    
    if (this.props.onSessionStart) {
      this.props.onSessionStart(this.currentSession);
    }
    
    this.startTimer();
    this.saveSessionData();
    this.rerender();
  }

  private startTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = window.setInterval(() => {
      if (!this.currentSession || this.currentSession.status !== 'running') {
        this.stopTimer();
        return;
      }
      
      this.currentSession.remainingTime--;
      
      if (this.currentSession.remainingTime <= 0) {
        this.completeSession();
      } else {
        this.rerender();
        this.saveSessionData();
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private completeSession(): void {
    if (!this.currentSession) return;
    
    this.stopTimer();
    this.currentSession.status = 'completed';
    this.currentSession.endTime = new Date().toISOString();
    this.currentSession.remainingTime = 0;
    
    if (this.currentSession.type === 'work') {
      this.completedSessions++;
    }
    
    if (this.props.onSessionComplete) {
      this.props.onSessionComplete(this.currentSession);
    }
    
    this.playNotificationSound();
    this.showNotification();
    
    this.saveSessionData();
    this.rerender();
    
    // Auto-start next session if enabled
    setTimeout(() => {
      if (this.currentSession?.type === 'work' && this.settings.autoStartBreaks) {
        this.startBreakSession();
      } else if (this.currentSession?.type !== 'work' && this.settings.autoStartWork) {
        this.startWorkSession();
      }
    }, 1000);
  }

  private pauseSession(): void {
    if (!this.currentSession) return;
    
    this.stopTimer();
    this.currentSession.status = 'paused';
    
    if (this.props.onSessionPause) {
      this.props.onSessionPause(this.currentSession);
    }
    
    this.saveSessionData();
    this.rerender();
  }

  private resumeSession(): void {
    if (!this.currentSession) return;
    
    this.currentSession.status = 'running';
    this.startTimer();
    this.rerender();
  }

  private stopSession(): void {
    if (!this.currentSession) return;
    
    this.stopTimer();
    this.currentSession.status = 'stopped';
    this.currentSession.endTime = new Date().toISOString();
    
    if (this.props.onSessionStop) {
      this.props.onSessionStop(this.currentSession);
    }
    
    this.currentSession = null;
    this.saveSessionData();
    this.rerender();
  }

  private resetTimer(): void {
    this.stopTimer();
    this.currentSession = null;
    this.sessionCount = 0;
    this.completedSessions = 0;
    this.saveSessionData();
    this.rerender();
  }

  private playNotificationSound(): void {
    if (!this.settings.soundEnabled || !this.audioContext) return;
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Failed to play notification sound');
    }
  }

  private showNotification(): void {
    if (!this.settings.notificationsEnabled || !this.isNotificationPermissionGranted || !this.currentSession) {
      return;
    }
    
    const messages = {
      work: 'Work session completed! Time for a break.',
      shortBreak: 'Break finished! Ready to get back to work?',
      longBreak: 'Long break completed! You\'ve earned some good rest.'
    };
    
    const notification = new Notification('Pomodoro Timer', {
      body: messages[this.currentSession.type],
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
    
    setTimeout(() => notification.close(), 5000);
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
    const paddedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds.toString();
    return `${paddedMinutes}:${paddedSeconds}`;
  }

  private getProgressPercentage(): number {
    if (!this.currentSession) return 0;
    const elapsed = this.currentSession.duration - this.currentSession.remainingTime;
    return (elapsed / this.currentSession.duration) * 100;
  }

  private getSessionTypeDisplay(): string {
    if (!this.currentSession) return 'Ready to Focus';
    
    const displays = {
      work: 'Focus Time',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
    };
    
    return displays[this.currentSession.type];
  }

  private getSessionTypeColor(): string {
    if (!this.currentSession) return 'text-gray-600 dark:text-gray-400';
    
    const colors = {
      work: 'text-red-600 dark:text-red-400',
      shortBreak: 'text-green-600 dark:text-green-400',
      longBreak: 'text-blue-600 dark:text-blue-400'
    };
    
    return colors[this.currentSession.type];
  }

  private renderTimer(): string {
    const timeDisplay = this.currentSession ? 
      this.formatTime(this.currentSession.remainingTime) : '25:00';
    const progress = this.getProgressPercentage();
    
    return `
      <div class="text-center">
        <!-- Session Type -->
        <h2 class="text-2xl font-bold mb-2 ${this.getSessionTypeColor()}">
          ${this.getSessionTypeDisplay()}
        </h2>
        
        <!-- Timer Display -->
        <div class="relative w-64 h-64 mx-auto mb-6">
          <!-- Progress Circle -->
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    class="text-gray-200 dark:text-gray-700" />
            <circle cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="3" 
                    class="${this.getSessionTypeColor()}"
                    stroke-linecap="round"
                    stroke-dasharray="283"
                    stroke-dashoffset="${283 - (283 * progress) / 100}"
                    style="transition: stroke-dashoffset 1s ease-in-out;" />
          </svg>
          
          <!-- Time Display -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-4xl font-mono font-bold text-gray-900 dark:text-white">
              ${timeDisplay}
            </span>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center justify-center space-x-4">
          ${!this.currentSession || this.currentSession.status === 'idle' ? `
            <button onclick="pomodoroTimer.startWorkSession()" 
                    class="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a2 2 0 012-2h8a2 2 0 012 2v2M9 18h6" />
              </svg>
              Start Focus
            </button>
          ` : this.currentSession.status === 'running' ? `
            <button onclick="pomodoroTimer.pauseSession()" 
                    class="flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6" />
              </svg>
              Pause
            </button>
          ` : this.currentSession.status === 'paused' ? `
            <button onclick="pomodoroTimer.resumeSession()" 
                    class="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a2 2 0 012-2h8a2 2 0 012 2v2M9 18h6" />
              </svg>
              Resume
            </button>
          ` : ''}
          
          ${this.currentSession && this.currentSession.status !== 'idle' ? `
            <button onclick="pomodoroTimer.stopSession()" 
                    class="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z" />
              </svg>
              Stop
            </button>
          ` : ''}
          
          <button onclick="pomodoroTimer.resetTimer()" 
                  class="flex items-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </div>
    `;
  }

  private renderStats(): string {
    const nextBreakType = this.completedSessions > 0 && 
                         (this.completedSessions + 1) % this.settings.sessionsUntilLongBreak === 0 
                         ? 'Long Break' : 'Short Break';
    
    return `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.completedSessions}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">${this.sessionCount}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-2xl font-bold text-gray-900 dark:text-white">${Math.floor((this.completedSessions * this.settings.workDuration) / 60)}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Hours Focused</div>
        </div>
        <div class="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-lg font-bold text-gray-900 dark:text-white">${nextBreakType}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">Next Break</div>
        </div>
      </div>
    `;
  }

  private renderQuickActions(): string {
    return `
      <div class="flex items-center justify-center space-x-3 mt-6">
        <button onclick="pomodoroTimer.startBreakSession()" 
                class="flex items-center px-3 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
          Quick Break
        </button>
      </div>
    `;
  }

  private rerender(): void {
    const container = document.getElementById('pomodoroTimerContainer');
    if (container) {
      container.innerHTML = this.render();
    }
  }

  public render(): string {
    // Store instance globally for event handlers
    (window as any).pomodoroTimer = this;

    return `
      <div id="pomodoroTimerContainer" class="pomodoro-timer bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 ${this.props.className}">
        ${this.renderStats()}
        ${this.renderTimer()}
        ${this.renderQuickActions()}
      </div>
    `;
  }

  public updateSettings(newSettings: Partial<PomodoroSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSessionData();
    this.rerender();
  }

  public getCurrentSession(): TimerSession | null {
    return this.currentSession;
  }

  public getStats(): TimerStats {
    const totalFocusTime = this.completedSessions * this.settings.workDuration;
    const averageSessionLength = this.completedSessions > 0 ? totalFocusTime / this.completedSessions : 0;
    
    return {
      totalSessions: this.sessionCount,
      completedSessions: this.completedSessions,
      totalFocusTime,
      averageSessionLength,
      longestStreak: 0, // Would need session history to calculate
      currentStreak: this.completedSessions
    };
  }

  public static create(props: PomodoroTimerProps): PomodoroTimer {
    return new PomodoroTimer(props);
  }
}

// Export for use in other components
export { PomodoroTimer };
export type { PomodoroTimerProps, PomodoroSettings, TimerSession, TimerStats };
