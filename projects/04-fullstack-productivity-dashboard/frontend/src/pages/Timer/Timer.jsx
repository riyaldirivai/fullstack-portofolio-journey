/**
 * Timer Page Component
 * Advanced timer with multiple modes, sessions, and analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaRedo,
  FaClock,
  FaCog,
  FaChartLine,
  FaHistory,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaBookmark,
  FaTag
} from 'react-icons/fa';

import { useTimer } from '../../hooks/useTimer';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import Modal from '../../components/common/Modal/Modal';
import Loading from '../../components/common/Loading/Loading';
import TimerDisplay from '../../components/timer/TimerDisplay/TimerDisplay';
import TimerControls from '../../components/timer/TimerControls/TimerControls';
import TimerModes from '../../components/timer/TimerModes/TimerModes';
import TimerSettings from '../../components/timer/TimerSettings/TimerSettings';
import TimerHistory from '../../components/timer/TimerHistory/TimerHistory';
import TimerStats from '../../components/timer/TimerStats/TimerStats';
import SessionSelector from '../../components/timer/SessionSelector/SessionSelector';
import TaskInput from '../../components/timer/TaskInput/TaskInput';

import './Timer.css';

const Timer = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  const {
    activeTimer,
    timerState,
    timerHistory,
    timerSettings,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    updateTimerSettings,
    saveSession,
    isLoading
  } = useTimer();

  // Local state
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [currentMode, setCurrentMode] = useState('pomodoro');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [sessionTags, setSessionTags] = useState([]);

  // Timer modes configuration
  const timerModes = {
    pomodoro: {
      name: 'Pomodoro',
      durations: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
      },
      cycles: 4,
      icon: '🍅'
    },
    focus: {
      name: 'Deep Focus',
      durations: {
        focus: 50 * 60,
        break: 10 * 60
      },
      cycles: 1,
      icon: '🎯'
    },
    sprint: {
      name: 'Sprint',
      durations: {
        work: 15 * 60,
        break: 3 * 60
      },
      cycles: 8,
      icon: '⚡'
    },
    custom: {
      name: 'Custom',
      durations: {
        work: timerSettings?.customDuration || 30 * 60,
        break: timerSettings?.customBreak || 5 * 60
      },
      cycles: 1,
      icon: '⚙️'
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (timerState.status === 'completed') {
      handleTimerComplete();
    }
  }, [timerState.status]);

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle timer completion
  const handleTimerComplete = async () => {
    if (!isMuted) {
      // Play completion sound
      const audio = new Audio('/sounds/timer-complete.mp3');
      audio.play().catch(console.error);
    }

    // Show notification
    showNotification({
      title: 'Timer Completed! 🎉',
      message: `Great job! You completed a ${timerModes[currentMode].name} session.`,
      type: 'success'
    });

    // Save session
    try {
      await saveSession({
        mode: currentMode,
        duration: timerState.duration,
        description: taskDescription,
        tags: sessionTags,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    // Auto-start break timer if in pomodoro mode
    if (currentMode === 'pomodoro' && timerState.cycleCount < timerModes.pomodoro.cycles) {
      const isLongBreak = timerState.cycleCount % 4 === 0;
      const breakDuration = isLongBreak 
        ? timerModes.pomodoro.durations.longBreak
        : timerModes.pomodoro.durations.shortBreak;
      
      setTimeout(() => {
        startTimer({
          duration: breakDuration,
          type: isLongBreak ? 'longBreak' : 'shortBreak',
          mode: currentMode
        });
      }, 3000); // 3 second delay
    }
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    if (timerState.status === 'running') {
      if (window.confirm('Changing mode will stop the current timer. Continue?')) {
        stopTimer();
        setCurrentMode(mode);
      }
    } else {
      setCurrentMode(mode);
    }
  };

  // Handle timer start
  const handleStart = () => {
    const mode = timerModes[currentMode];
    const duration = mode.durations.focus || mode.durations.work;
    
    startTimer({
      duration,
      mode: currentMode,
      description: taskDescription,
      tags: sessionTags
    });
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Handle preset selection
  const handlePresetSelect = (preset) => {
    if (timerState.status === 'running') {
      if (window.confirm('Selecting a preset will stop the current timer. Continue?')) {
        stopTimer();
        applyPreset(preset);
      }
    } else {
      applyPreset(preset);
    }
  };

  // Apply preset configuration
  const applyPreset = (preset) => {
    setSelectedPreset(preset);
    setCurrentMode(preset.mode);
    if (preset.task) {
      setTaskDescription(preset.task);
    }
    if (preset.tags) {
      setSessionTags(preset.tags);
    }
  };

  // Calculate progress percentage
  const getProgress = () => {
    if (!timerState.duration || !timerState.timeRemaining) return 0;
    return ((timerState.duration - timerState.timeRemaining) / timerState.duration) * 100;
  };

  if (isLoading) {
    return <Loading message="Loading timer..." />;
  }

  return (
    <div className={`timer ${isFullscreen ? 'timer--fullscreen' : ''}`}>
      {/* Header */}
      <div className="timer__header">
        <div className="timer__title-section">
          <h1 className="timer__title">
            <FaClock className="timer__title-icon" />
            Focus Timer
          </h1>
          <p className="timer__subtitle">
            Stay focused and track your productivity
          </p>
        </div>
        
        <div className="timer__header-controls">
          <Button
            variant="outline"
            size="small"
            icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="timer__control-btn"
          />
          
          <Button
            variant="outline"
            size="small"
            icon={<FaHistory />}
            onClick={() => setShowHistory(true)}
            title="Timer History"
            className="timer__control-btn"
          />
          
          <Button
            variant="outline"
            size="small"
            icon={<FaChartLine />}
            onClick={() => setShowStats(true)}
            title="Timer Statistics"
            className="timer__control-btn"
          />
          
          <Button
            variant="outline"
            size="small"
            icon={<FaCog />}
            onClick={() => setShowSettings(true)}
            title="Timer Settings"
            className="timer__control-btn"
          />
          
          <Button
            variant="outline"
            size="small"
            icon={isFullscreen ? <FaCompress /> : <FaExpand />}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="timer__control-btn"
          />
        </div>
      </div>

      {/* Timer Modes */}
      <div className="timer__modes">
        <TimerModes
          modes={timerModes}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          disabled={timerState.status === 'running'}
        />
      </div>

      {/* Main Timer Section */}
      <div className="timer__main">
        <Card className="timer__display-card">
          {/* Mode Info */}
          <div className="timer__mode-info">
            <span className="timer__mode-icon">
              {timerModes[currentMode].icon}
            </span>
            <span className="timer__mode-name">
              {timerModes[currentMode].name}
            </span>
            {timerState.cycleCount > 0 && (
              <span className="timer__cycle-count">
                Cycle {timerState.cycleCount}/{timerModes[currentMode].cycles}
              </span>
            )}
          </div>

          {/* Timer Display */}
          <TimerDisplay
            timeRemaining={timerState.timeRemaining || timerModes[currentMode].durations.focus || timerModes[currentMode].durations.work}
            totalTime={timerState.duration || timerModes[currentMode].durations.focus || timerModes[currentMode].durations.work}
            status={timerState.status}
            progress={getProgress()}
          />

          {/* Timer Controls */}
          <TimerControls
            status={timerState.status}
            onStart={handleStart}
            onPause={pauseTimer}
            onStop={stopTimer}
            onReset={resetTimer}
          />

          {/* Current Session Info */}
          {timerState.status !== 'idle' && (
            <div className="timer__session-info">
              {taskDescription && (
                <div className="timer__current-task">
                  <FaBookmark className="timer__task-icon" />
                  <span>{taskDescription}</span>
                </div>
              )}
              
              {sessionTags.length > 0 && (
                <div className="timer__current-tags">
                  <FaTag className="timer__tags-icon" />
                  {sessionTags.map((tag, index) => (
                    <span key={index} className="timer__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Session Setup */}
      <div className="timer__setup">
        <div className="timer__setup-section">
          <TaskInput
            value={taskDescription}
            onChange={setTaskDescription}
            placeholder="What are you working on?"
          />
        </div>
        
        <div className="timer__setup-section">
          <SessionSelector
            tags={sessionTags}
            onTagsChange={setSessionTags}
            presets={timerSettings?.presets || []}
            onPresetSelect={handlePresetSelect}
            selectedPreset={selectedPreset}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="timer__quick-stats">
        <div className="timer__stat">
          <span className="timer__stat-label">Today</span>
          <span className="timer__stat-value">
            {formatTime(timerHistory?.todayTotal || 0)}
          </span>
        </div>
        <div className="timer__stat">
          <span className="timer__stat-label">This Week</span>
          <span className="timer__stat-value">
            {formatTime(timerHistory?.weekTotal || 0)}
          </span>
        </div>
        <div className="timer__stat">
          <span className="timer__stat-label">Sessions</span>
          <span className="timer__stat-value">
            {timerHistory?.todaySessions || 0}
          </span>
        </div>
        <div className="timer__stat">
          <span className="timer__stat-label">Streak</span>
          <span className="timer__stat-value">
            {timerHistory?.currentStreak || 0} days
          </span>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Timer Settings"
        className="timer__settings-modal"
      >
        <TimerSettings
          settings={timerSettings}
          onSave={updateTimerSettings}
          onClose={() => setShowSettings(false)}
        />
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Timer History"
        className="timer__history-modal"
      >
        <TimerHistory
          history={timerHistory}
          onClose={() => setShowHistory(false)}
        />
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        title="Timer Statistics"
        className="timer__stats-modal"
      >
        <TimerStats
          history={timerHistory}
          onClose={() => setShowStats(false)}
        />
      </Modal>
    </div>
  );
};

export default Timer;
