/**
 * Custom Hook: useTimer
 * Manages timer state, sessions, history, and timer-related operations
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { timerService } from '../services/api/timerService';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

export const useTimer = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // Timer state
  const [timerState, setTimerState] = useState({
    status: 'idle', // idle, running, paused, completed
    timeRemaining: 0,
    duration: 0,
    startedAt: null,
    pausedAt: null,
    mode: 'pomodoro',
    type: 'focus',
    cycleCount: 0,
    description: '',
    tags: []
  });

  // Timer history and settings
  const [timerHistory, setTimerHistory] = useState([]);
  const [timerSettings, setTimerSettings] = useState({
    autoStartBreaks: true,
    autoStartPomodoros: false,
    longBreakInterval: 4,
    notifications: true,
    sounds: true,
    customDuration: 25 * 60,
    customBreak: 5 * 60
  });

  const [activeTimer, setActiveTimer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for interval management
  const timerInterval = useRef(null);
  const audioContext = useRef(null);

  // Load user's timer history and settings on mount
  useEffect(() => {
    if (user) {
      loadTimerData();
    }
  }, [user]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.status === 'running') {
      timerInterval.current = setInterval(() => {
        setTimerState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          if (newTimeRemaining <= 0) {
            handleTimerComplete();
            return {
              ...prev,
              timeRemaining: 0,
              status: 'completed'
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTimeRemaining
          };
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [timerState.status]);

  // Load timer data from API
  const loadTimerData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [history, settings, active] = await Promise.all([
        timerService.getTimerHistory(),
        timerService.getTimerSettings(),
        timerService.getActiveTimer()
      ]);

      setTimerHistory(history);
      setTimerSettings({ ...timerSettings, ...settings });
      
      if (active) {
        setActiveTimer(active);
        restoreTimerState(active);
      }
    } catch (error) {
      setError(error.message);
      console.error('Failed to load timer data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore timer state from active timer
  const restoreTimerState = useCallback((activeTimer) => {
    const now = Date.now();
    const startedAt = new Date(activeTimer.startedAt).getTime();
    const elapsed = Math.floor((now - startedAt) / 1000);
    const timeRemaining = Math.max(0, activeTimer.duration - elapsed);

    setTimerState({
      status: timeRemaining > 0 ? 'running' : 'completed',
      timeRemaining,
      duration: activeTimer.duration,
      startedAt: activeTimer.startedAt,
      pausedAt: activeTimer.pausedAt,
      mode: activeTimer.mode,
      type: activeTimer.type,
      cycleCount: activeTimer.cycleCount || 0,
      description: activeTimer.description || '',
      tags: activeTimer.tags || []
    });
  }, []);

  // Start timer
  const startTimer = useCallback(async (options = {}) => {
    setIsLoading(true);
    try {
      const timerConfig = {
        duration: options.duration || 25 * 60,
        mode: options.mode || 'pomodoro',
        type: options.type || 'focus',
        description: options.description || '',
        tags: options.tags || [],
        userId: user.id
      };

      const newTimer = await timerService.startTimer(timerConfig);
      
      setActiveTimer(newTimer);
      setTimerState({
        status: 'running',
        timeRemaining: timerConfig.duration,
        duration: timerConfig.duration,
        startedAt: new Date().toISOString(),
        pausedAt: null,
        mode: timerConfig.mode,
        type: timerConfig.type,
        cycleCount: 0,
        description: timerConfig.description,
        tags: timerConfig.tags
      });

      showNotification({
        type: 'success',
        title: 'Timer Started! ⏰',
        message: `${Math.floor(timerConfig.duration / 60)} minute ${timerConfig.type} session started.`
      });

    } catch (error) {
      setError(error.message);
      showNotification({
        type: 'error',
        title: 'Failed to start timer',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    if (timerState.status !== 'running') return;

    try {
      if (activeTimer) {
        await timerService.pauseTimer(activeTimer.id);
      }

      setTimerState(prev => ({
        ...prev,
        status: 'paused',
        pausedAt: new Date().toISOString()
      }));

      showNotification({
        type: 'info',
        title: 'Timer Paused',
        message: 'Take a moment to recharge!'
      });

    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }, [timerState.status, activeTimer, showNotification]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    if (timerState.status !== 'paused') return;

    try {
      if (activeTimer) {
        await timerService.resumeTimer(activeTimer.id);
      }

      setTimerState(prev => ({
        ...prev,
        status: 'running',
        pausedAt: null
      }));

      showNotification({
        type: 'success',
        title: 'Timer Resumed',
        message: 'Back to work! Stay focused!'
      });

    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  }, [timerState.status, activeTimer, showNotification]);

  // Stop timer
  const stopTimer = useCallback(async () => {
    if (timerState.status === 'idle') return;

    try {
      if (activeTimer) {
        await timerService.stopTimer(activeTimer.id);
      }

      setTimerState({
        status: 'idle',
        timeRemaining: 0,
        duration: 0,
        startedAt: null,
        pausedAt: null,
        mode: 'pomodoro',
        type: 'focus',
        cycleCount: 0,
        description: '',
        tags: []
      });

      setActiveTimer(null);
      await loadTimerData(); // Refresh history

      showNotification({
        type: 'info',
        title: 'Timer Stopped',
        message: 'Session ended. Great effort!'
      });

    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  }, [timerState.status, activeTimer, showNotification, loadTimerData]);

  // Reset timer
  const resetTimer = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      timeRemaining: prev.duration,
      status: 'idle',
      startedAt: null,
      pausedAt: null
    }));
  }, []);

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    try {
      if (activeTimer) {
        await timerService.completeTimer(activeTimer.id);
      }

      // Play completion sound
      if (timerSettings.sounds) {
        playCompletionSound();
      }

      // Show completion notification
      showNotification({
        type: 'success',
        title: 'Session Complete! 🎉',
        message: `Great job! You completed a ${timerState.type} session.`,
        duration: 5000
      });

      // Auto-start break if enabled
      if (timerSettings.autoStartBreaks && timerState.type === 'focus') {
        setTimeout(() => {
          const isLongBreak = (timerState.cycleCount + 1) % timerSettings.longBreakInterval === 0;
          const breakDuration = isLongBreak ? 15 * 60 : 5 * 60;
          
          startTimer({
            duration: breakDuration,
            type: isLongBreak ? 'longBreak' : 'shortBreak',
            mode: timerState.mode
          });
        }, 3000);
      }

      setActiveTimer(null);
      await loadTimerData();

    } catch (error) {
      console.error('Failed to complete timer:', error);
    }
  }, [activeTimer, timerSettings, timerState, showNotification, startTimer, loadTimerData]);

  // Play completion sound
  const playCompletionSound = useCallback(() => {
    try {
      // Create audio context if not exists
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create completion tone
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.5);

    } catch (error) {
      console.error('Failed to play completion sound:', error);
    }
  }, []);

  // Create quick timer
  const createQuickTimer = useCallback(async (options) => {
    await startTimer(options);
  }, [startTimer]);

  // Save session manually
  const saveSession = useCallback(async (sessionData) => {
    try {
      const session = await timerService.saveSession({
        ...sessionData,
        userId: user.id,
        completedAt: new Date().toISOString()
      });

      setTimerHistory(prev => [session, ...prev]);
      return session;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }, [user]);

  // Update timer settings
  const updateTimerSettings = useCallback(async (newSettings) => {
    try {
      const updatedSettings = await timerService.updateSettings({
        ...timerSettings,
        ...newSettings
      });

      setTimerSettings(updatedSettings);
      
      showNotification({
        type: 'success',
        title: 'Settings Updated',
        message: 'Timer settings saved successfully.'
      });

    } catch (error) {
      console.error('Failed to update settings:', error);
      showNotification({
        type: 'error',
        title: 'Settings Update Failed',
        message: error.message
      });
    }
  }, [timerSettings, showNotification]);

  // Get timer statistics
  const getTimerStats = useCallback(() => {
    const today = new Date().toDateString();
    const todaySessions = timerHistory.filter(
      session => new Date(session.createdAt).toDateString() === today
    );

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekSessions = timerHistory.filter(
      session => new Date(session.createdAt) >= thisWeek
    );

    return {
      todayTotal: todaySessions.reduce((total, session) => total + (session.duration || 0), 0),
      todaySessions: todaySessions.length,
      weekTotal: weekSessions.reduce((total, session) => total + (session.duration || 0), 0),
      weekSessions: weekSessions.length,
      totalSessions: timerHistory.length,
      longestSession: Math.max(...timerHistory.map(s => s.duration || 0), 0),
      currentStreak: calculateStreak()
    };
  }, [timerHistory]);

  // Calculate current streak
  const calculateStreak = useCallback(() => {
    if (timerHistory.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sessionDates = new Set();
    timerHistory.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      sessionDate.setHours(0, 0, 0, 0);
      sessionDates.add(sessionDate.getTime());
    });

    while (sessionDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }, [timerHistory]);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Get progress percentage
  const getProgress = useCallback(() => {
    if (timerState.duration === 0) return 0;
    return ((timerState.duration - timerState.timeRemaining) / timerState.duration) * 100;
  }, [timerState.duration, timerState.timeRemaining]);

  return {
    // State
    timerState,
    activeTimer,
    timerHistory,
    timerSettings,
    isLoading,
    error,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    createQuickTimer,
    saveSession,
    updateTimerSettings,

    // Utilities
    getTimerStats,
    formatTime,
    getProgress,
    
    // Data refresh
    loadTimerData
  };
};
