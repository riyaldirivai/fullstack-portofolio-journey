/**
 * Goals Page Component
 * Complete goal management with CRUD operations and progress tracking
 */

import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaClock,
  FaTarget,
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaSortAmountDown,
  FaChartPie
} from 'react-icons/fa';

import { useGoals } from '../../hooks/useGoals';
import { useAuth } from '../../hooks/useAuth';

import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import Modal from '../../components/common/Modal/Modal';
import Loading from '../../components/common/Loading/Loading';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import FilterDropdown from '../../components/common/FilterDropdown/FilterDropdown';
import GoalCard from '../../components/goals/GoalCard/GoalCard';
import GoalForm from '../../components/goals/GoalForm/GoalForm';
import GoalProgressChart from '../../components/goals/GoalProgressChart/GoalProgressChart';
import GoalStats from '../../components/goals/GoalStats/GoalStats';

import './Goals.css';

const Goals = () => {
  const { user } = useAuth();
  const {
    goals,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    getGoalProgress,
    isLoading,
    error
  } = useGoals();

  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [viewMode, setViewMode] = useState('grid');

  // Handle goal creation
  const handleCreateGoal = async (goalData) => {
    try {
      await createGoal(goalData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  // Handle goal update
  const handleUpdateGoal = async (goalData) => {
    try {
      await updateGoal(selectedGoal.id, goalData);
      setShowEditModal(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  // Handle goal completion
  const handleCompleteGoal = async (goalId) => {
    try {
      await completeGoal(goalId);
    } catch (error) {
      console.error('Failed to complete goal:', error);
    }
  };

  // Open edit modal
  const handleEditGoal = (goal) => {
    setSelectedGoal(goal);
    setShowEditModal(true);
  };

  // Filter and sort goals
  const filteredAndSortedGoals = React.useMemo(() => {
    let filtered = goals.filter(goal => {
      // Search filter
      const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
      
      // Priority filter
      const matchesPriority = filterPriority === 'all' || goal.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort goals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [goals, searchTerm, filterStatus, filterPriority, sortBy]);

  // Calculate goal statistics
  const goalStats = React.useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(goal => goal.status === 'completed').length;
    const active = goals.filter(goal => goal.status === 'active').length;
    const overdue = goals.filter(goal => 
      goal.status === 'active' && 
      new Date(goal.dueDate) < new Date()
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, overdue, completionRate };
  }, [goals]);

  if (isLoading) {
    return <Loading message="Loading your goals..." />;
  }

  return (
    <div className="goals">
      {/* Header Section */}
      <div className="goals__header">
        <div className="goals__header-content">
          <div className="goals__title-section">
            <h1 className="goals__title">
              <FaTarget className="goals__title-icon" />
              My Goals
            </h1>
            <p className="goals__subtitle">
              Track your progress and achieve your objectives
            </p>
          </div>
          
          <div className="goals__header-actions">
            <Button
              variant="primary"
              size="medium"
              icon={<FaPlus />}
              onClick={() => setShowCreateModal(true)}
            >
              New Goal
            </Button>
          </div>
        </div>

        {/* Goal Statistics */}
        <GoalStats stats={goalStats} />
      </div>

      {/* Controls Section */}
      <div className="goals__controls">
        <div className="goals__controls-left">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search goals..."
            className="goals__search"
          />
          
          <FilterDropdown
            label="Status"
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'paused', label: 'Paused' }
            ]}
            icon={<FaFilter />}
          />
          
          <FilterDropdown
            label="Priority"
            value={filterPriority}
            onChange={setFilterPriority}
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' }
            ]}
            icon={<FaTarget />}
          />
        </div>

        <div className="goals__controls-right">
          <FilterDropdown
            label="Sort"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'dueDate', label: 'Due Date' },
              { value: 'priority', label: 'Priority' },
              { value: 'progress', label: 'Progress' },
              { value: 'created', label: 'Date Created' }
            ]}
            icon={<FaSortAmountDown />}
          />

          <div className="goals__view-toggle">
            <button
              className={`goals__view-btn ${viewMode === 'grid' ? 'goals__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`goals__view-btn ${viewMode === 'list' ? 'goals__view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="goals__results-info">
        <p className="goals__results-text">
          Showing {filteredAndSortedGoals.length} of {goals.length} goals
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Goals Content */}
      <div className="goals__content">
        {filteredAndSortedGoals.length === 0 ? (
          <div className="goals__empty-state">
            <div className="goals__empty-icon">
              <FaTarget />
            </div>
            <h3 className="goals__empty-title">
              {goals.length === 0 
                ? "No goals yet" 
                : "No goals match your filters"
              }
            </h3>
            <p className="goals__empty-description">
              {goals.length === 0 
                ? "Start by creating your first goal to track your progress and stay motivated."
                : "Try adjusting your search terms or filters to find what you're looking for."
              }
            </p>
            {goals.length === 0 && (
              <Button
                variant="primary"
                size="medium"
                icon={<FaPlus />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Goal
              </Button>
            )}
          </div>
        ) : (
          <div className={`goals__grid ${viewMode === 'list' ? 'goals__grid--list' : ''}`}>
            {filteredAndSortedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleEditGoal(goal)}
                onDelete={() => handleDeleteGoal(goal.id)}
                onComplete={() => handleCompleteGoal(goal.id)}
                onProgress={getGoalProgress}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {goals.length > 0 && (
        <div className="goals__overview">
          <Card className="goals__progress-chart">
            <div className="goals__chart-header">
              <h3 className="goals__chart-title">
                <FaChartPie className="goals__chart-icon" />
                Progress Overview
              </h3>
            </div>
            <GoalProgressChart goals={goals} />
          </Card>
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Goal"
        className="goals__create-modal"
      >
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGoal(null);
        }}
        title="Edit Goal"
        className="goals__edit-modal"
      >
        {selectedGoal && (
          <GoalForm
            goal={selectedGoal}
            onSubmit={handleUpdateGoal}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedGoal(null);
            }}
          />
        )}
      </Modal>

      {/* Error Display */}
      {error && (
        <div className="goals__error">
          <p>Error: {error.message}</p>
        </div>
      )}
    </div>
  );
};

export default Goals;
