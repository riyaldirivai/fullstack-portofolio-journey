/**
 * Dashboard Page Component
 * Main productivity dashboard with overview widgets and quick actions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPlay, 
  FaPause, 
  FaStop, 
  FaPlus, 
  FaChartLine, 
  FaClock,
  FaTarget,
  FaCalendarAlt,
  FaTrophy,
  FaFire
} from 'react-icons/fa';

import { useAuth } from '../../hooks/useAuth';
import { useTimer } from '../../hooks/useTimer';
import { useGoals } from '../../hooks/useGoals';
import { useAnalytics } from '../../hooks/useAnalytics';

import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import Loading from '../../components/common/Loading/Loading';
import StatsWidget from '../../components/dashboard/StatsWidget/StatsWidget';
import QuickTimerCard from '../../components/dashboard/QuickTimerCard/QuickTimerCard';
import RecentGoalsCard from '../../components/dashboard/RecentGoalsCard/RecentGoalsCard';
import ProgressChart from '../../components/dashboard/ProgressChart/ProgressChart';

import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    activeTimer,
    timerHistory,
    startTimer,
    pauseTimer,
    stopTimer,
    createQuickTimer,
    isLoading: timerLoading
  } = useTimer();
  
  const { 
    goals,
    recentGoals,
    getGoalProgress,
    isLoading: goalsLoading
  } = useGoals();
  
  const {
    todayStats,
    weeklyStats,
    monthlyStats,
    isLoading: analyticsLoading
  } = useAnalytics();

  const [greeting, setGreeting] = useState('');
  const [quickTimerDuration, setQuickTimerDuration] = useState(25);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  // Handle quick timer start
  const handleQuickTimer = async (duration) => {
    try {
      await createQuickTimer({
        duration: duration * 60, // Convert minutes to seconds
        type: 'focus',
        description: `Quick ${duration} minute focus session`
      });
    } catch (error) {
      console.error('Failed to start quick timer:', error);
    }
  };

  // Calculate progress stats
  const calculateProgressStats = () => {
    if (!goals.length) return { completed: 0, inProgress: 0, total: 0 };
    
    const completed = goals.filter(goal => goal.status === 'completed').length;
    const inProgress = goals.filter(goal => goal.status === 'active').length;
    const total = goals.length;
    
    return { completed, inProgress, total };
  };

  const progressStats = calculateProgressStats();

  if (timerLoading || goalsLoading || analyticsLoading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1 className="dashboard__title">
            {greeting}, {user?.name || 'Productivity Master'}! 👋
          </h1>
          <p className="dashboard__subtitle">
            Ready to make today productive? Here's your overview.
          </p>
        </div>
        
        <div className="dashboard__quick-actions">
          <Button
            variant="primary"
            size="medium"
            onClick={() => handleQuickTimer(25)}
            icon={<FaPlay />}
          >
            Quick 25min
          </Button>
          <Link to="/timer">
            <Button variant="outline" size="medium" icon={<FaClock />}>
              Full Timer
            </Button>
          </Link>
          <Link to="/goals">
            <Button variant="outline" size="medium" icon={<FaTarget />}>
              New Goal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="dashboard__stats">
        <StatsWidget
          title="Today's Focus Time"
          value={`${Math.floor((todayStats?.totalFocusTime || 0) / 60)}h ${(todayStats?.totalFocusTime || 0) % 60}m`}
          icon={<FaClock />}
          color="blue"
          trend={todayStats?.focusTimeTrend}
        />
        
        <StatsWidget
          title="Sessions Completed"
          value={todayStats?.completedSessions || 0}
          icon={<FaTrophy />}
          color="green"
          trend={todayStats?.sessionsTrend}
        />
        
        <StatsWidget
          title="Goals Progress"
          value={`${progressStats.completed}/${progressStats.total}`}
          icon={<FaTarget />}
          color="purple"
          subtext={`${progressStats.inProgress} in progress`}
        />
        
        <StatsWidget
          title="Streak"
          value={`${weeklyStats?.currentStreak || 0} days`}
          icon={<FaFire />}
          color="orange"
          subtext="Keep it going!"
        />
      </div>

      {/* Main Content Grid */}
      <div className="dashboard__content">
        {/* Quick Timer Section */}
        <div className="dashboard__section">
          <QuickTimerCard
            activeTimer={activeTimer}
            onStartTimer={handleQuickTimer}
            onPauseTimer={pauseTimer}
            onStopTimer={stopTimer}
            presetDurations={[15, 25, 45, 60]}
          />
        </div>

        {/* Recent Goals Section */}
        <div className="dashboard__section">
          <RecentGoalsCard
            goals={recentGoals}
            onGoalProgress={getGoalProgress}
          />
        </div>

        {/* Progress Chart Section */}
        <div className="dashboard__section dashboard__section--wide">
          <Card className="dashboard__chart-card">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">
                <FaChartLine className="dashboard__card-icon" />
                Weekly Progress
              </h3>
              <Link to="/analytics" className="dashboard__view-all">
                View Details
              </Link>
            </div>
            <ProgressChart data={weeklyStats} />
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="dashboard__section">
          <Card className="dashboard__activity-card">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">
                <FaCalendarAlt className="dashboard__card-icon" />
                Recent Activity
              </h3>
            </div>
            <div className="dashboard__activity-list">
              {timerHistory?.slice(0, 5).map((session, index) => (
                <div key={session.id || index} className="dashboard__activity-item">
                  <div className="dashboard__activity-icon">
                    <FaClock />
                  </div>
                  <div className="dashboard__activity-content">
                    <p className="dashboard__activity-title">
                      {session.description || 'Focus Session'}
                    </p>
                    <p className="dashboard__activity-meta">
                      {Math.floor(session.duration / 60)}m • 
                      {new Date(session.endedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="dashboard__activity-status">
                    <span className={`dashboard__status dashboard__status--${session.status}`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="dashboard__empty-state">
                  <p>No recent activity. Start your first session!</p>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleQuickTimer(25)}
                    icon={<FaPlay />}
                  >
                    Start Now
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Stats Section */}
        <div className="dashboard__section">
          <Card className="dashboard__quick-stats">
            <div className="dashboard__card-header">
              <h3 className="dashboard__card-title">This Week</h3>
            </div>
            <div className="dashboard__quick-stats-grid">
              <div className="dashboard__quick-stat">
                <span className="dashboard__quick-stat-label">Focus Time</span>
                <span className="dashboard__quick-stat-value">
                  {Math.floor((weeklyStats?.totalFocusTime || 0) / 60)}h
                </span>
              </div>
              <div className="dashboard__quick-stat">
                <span className="dashboard__quick-stat-label">Sessions</span>
                <span className="dashboard__quick-stat-value">
                  {weeklyStats?.totalSessions || 0}
                </span>
              </div>
              <div className="dashboard__quick-stat">
                <span className="dashboard__quick-stat-label">Avg/Day</span>
                <span className="dashboard__quick-stat-value">
                  {Math.floor((weeklyStats?.avgDailyFocus || 0) / 60)}h
                </span>
              </div>
              <div className="dashboard__quick-stat">
                <span className="dashboard__quick-stat-label">Best Day</span>
                <span className="dashboard__quick-stat-value">
                  {weeklyStats?.bestDay || 'Today'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Action Footer */}
      <div className="dashboard__footer">
        <div className="dashboard__footer-content">
          <div className="dashboard__motivation">
            <h3>💪 Keep Going!</h3>
            <p>
              You're doing great! Every session counts towards your productivity goals.
            </p>
          </div>
          <div className="dashboard__footer-actions">
            <Link to="/goals">
              <Button variant="outline" size="medium">
                Manage Goals
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="medium">
                View Analytics
              </Button>
            </Link>
            <Link to="/settings">
              <Button variant="outline" size="medium">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
