/**
 * Custom Hook: useGoals
 * Manages goals state, CRUD operations, and goal-related functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { goalService } from '../services/api/goalService';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

export const useGoals = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();

  // Goals state
  const [goals, setGoals] = useState([]);
  const [recentGoals, setRecentGoals] = useState([]);
  const [goalCategories, setGoalCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load goals data on mount
  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  // Load goals from API
  const loadGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      const [goalsData, categoriesData] = await Promise.all([
        goalService.getGoals(),
        goalService.getGoalCategories()
      ]);

      setGoals(goalsData.goals || []);
      setRecentGoals(goalsData.goals?.slice(0, 5) || []);
      setGoalCategories(categoriesData || []);
      setError(null);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load goals';
      setError(message);
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new goal
  const createGoal = useCallback(async (goalData) => {
    setIsLoading(true);
    try {
      const newGoal = await goalService.createGoal({
        ...goalData,
        userId: user.id,
        createdAt: new Date().toISOString(),
        status: 'active',
        progress: 0
      });

      setGoals(prev => [newGoal, ...prev]);
      setRecentGoals(prev => [newGoal, ...prev.slice(0, 4)]);

      showNotification({
        type: 'success',
        title: 'Goal Created! 🎯',
        message: `"${newGoal.title}" has been added to your goals.`
      });

      return newGoal;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create goal';
      setError(message);
      showNotification({
        type: 'error',
        title: 'Failed to create goal',
        message
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  // Update existing goal
  const updateGoal = useCallback(async (goalId, updatedData) => {
    setIsLoading(true);
    try {
      const updatedGoal = await goalService.updateGoal(goalId, {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });

      setGoals(prev => 
        prev.map(goal => goal.id === goalId ? updatedGoal : goal)
      );

      setRecentGoals(prev =>
        prev.map(goal => goal.id === goalId ? updatedGoal : goal)
      );

      showNotification({
        type: 'success',
        title: 'Goal Updated',
        message: `"${updatedGoal.title}" has been updated.`
      });

      return updatedGoal;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update goal';
      setError(message);
      showNotification({
        type: 'error',
        title: 'Failed to update goal',
        message
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Delete goal
  const deleteGoal = useCallback(async (goalId) => {
    setIsLoading(true);
    try {
      await goalService.deleteGoal(goalId);

      const deletedGoal = goals.find(goal => goal.id === goalId);
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setRecentGoals(prev => prev.filter(goal => goal.id !== goalId));

      showNotification({
        type: 'success',
        title: 'Goal Deleted',
        message: `"${deletedGoal?.title}" has been removed.`
      });

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete goal';
      setError(message);
      showNotification({
        type: 'error',
        title: 'Failed to delete goal',
        message
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [goals, showNotification]);

  // Complete goal
  const completeGoal = useCallback(async (goalId) => {
    try {
      const completedGoal = await goalService.completeGoal(goalId);

      setGoals(prev =>
        prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, status: 'completed', progress: 100, completedAt: new Date().toISOString() }
            : goal
        )
      );

      showNotification({
        type: 'success',
        title: 'Goal Completed! 🎉',
        message: `Congratulations! You completed "${completedGoal.title}".`,
        duration: 5000
      });

      return completedGoal;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete goal';
      showNotification({
        type: 'error',
        title: 'Failed to complete goal',
        message
      });
      throw error;
    }
  }, [showNotification]);

  // Update goal progress
  const updateGoalProgress = useCallback(async (goalId, progress) => {
    try {
      const updatedGoal = await goalService.updateGoalProgress(goalId, progress);

      setGoals(prev =>
        prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, progress, updatedAt: new Date().toISOString() }
            : goal
        )
      );

      // Show milestone notifications
      const milestones = [25, 50, 75, 100];
      const previousProgress = goals.find(g => g.id === goalId)?.progress || 0;
      const reachedMilestone = milestones.find(m => progress >= m && previousProgress < m);

      if (reachedMilestone) {
        showNotification({
          type: 'success',
          title: `${reachedMilestone}% Progress! 🎯`,
          message: `Great work on "${updatedGoal.title}"!`
        });
      }

      return updatedGoal;
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  }, [goals, showNotification]);

  // Get goal progress (for external use)
  const getGoalProgress = useCallback((goalId) => {
    const goal = goals.find(g => g.id === goalId);
    return goal?.progress || 0;
  }, [goals]);

  // Pause/Resume goal
  const toggleGoalStatus = useCallback(async (goalId) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const newStatus = goal?.status === 'active' ? 'paused' : 'active';
      
      const updatedGoal = await goalService.updateGoal(goalId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      setGoals(prev =>
        prev.map(goal => goal.id === goalId ? updatedGoal : goal)
      );

      showNotification({
        type: 'info',
        title: `Goal ${newStatus === 'active' ? 'Resumed' : 'Paused'}`,
        message: `"${updatedGoal.title}" is now ${newStatus}.`
      });

      return updatedGoal;
    } catch (error) {
      console.error('Failed to toggle goal status:', error);
      throw error;
    }
  }, [goals, showNotification]);

  // Duplicate goal
  const duplicateGoal = useCallback(async (goalId) => {
    try {
      const originalGoal = goals.find(g => g.id === goalId);
      if (!originalGoal) throw new Error('Goal not found');

      const duplicatedGoal = await createGoal({
        ...originalGoal,
        title: `${originalGoal.title} (Copy)`,
        progress: 0,
        status: 'active',
        completedAt: null
      });

      return duplicatedGoal;
    } catch (error) {
      console.error('Failed to duplicate goal:', error);
      throw error;
    }
  }, [goals, createGoal]);

  // Archive goal
  const archiveGoal = useCallback(async (goalId) => {
    try {
      const archivedGoal = await goalService.archiveGoal(goalId);

      setGoals(prev =>
        prev.map(goal => 
          goal.id === goalId 
            ? { ...goal, status: 'archived', archivedAt: new Date().toISOString() }
            : goal
        )
      );

      showNotification({
        type: 'info',
        title: 'Goal Archived',
        message: `"${archivedGoal.title}" has been archived.`
      });

      return archivedGoal;
    } catch (error) {
      console.error('Failed to archive goal:', error);
      throw error;
    }
  }, [showNotification]);

  // Get goals by status
  const getGoalsByStatus = useCallback((status) => {
    return goals.filter(goal => goal.status === status);
  }, [goals]);

  // Get goals by category
  const getGoalsByCategory = useCallback((category) => {
    return goals.filter(goal => goal.category === category);
  }, [goals]);

  // Get goals by priority
  const getGoalsByPriority = useCallback((priority) => {
    return goals.filter(goal => goal.priority === priority);
  }, [goals]);

  // Get overdue goals
  const getOverdueGoals = useCallback(() => {
    const now = new Date();
    return goals.filter(goal => 
      goal.status === 'active' && 
      new Date(goal.dueDate) < now
    );
  }, [goals]);

  // Get upcoming goals (due in next 7 days)
  const getUpcomingGoals = useCallback(() => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return goals.filter(goal => 
      goal.status === 'active' && 
      new Date(goal.dueDate) >= now &&
      new Date(goal.dueDate) <= nextWeek
    );
  }, [goals]);

  // Calculate goal statistics
  const getGoalStats = useCallback(() => {
    const total = goals.length;
    const completed = goals.filter(goal => goal.status === 'completed').length;
    const active = goals.filter(goal => goal.status === 'active').length;
    const paused = goals.filter(goal => goal.status === 'paused').length;
    const overdue = getOverdueGoals().length;
    const upcoming = getUpcomingGoals().length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const averageProgress = active > 0 
      ? Math.round(goals.filter(g => g.status === 'active')
          .reduce((sum, goal) => sum + (goal.progress || 0), 0) / active)
      : 0;

    return {
      total,
      completed,
      active,
      paused,
      overdue,
      upcoming,
      completionRate,
      averageProgress
    };
  }, [goals, getOverdueGoals, getUpcomingGoals]);

  // Search goals
  const searchGoals = useCallback((searchTerm) => {
    if (!searchTerm) return goals;
    
    const term = searchTerm.toLowerCase();
    return goals.filter(goal =>
      goal.title.toLowerCase().includes(term) ||
      goal.description?.toLowerCase().includes(term) ||
      goal.category?.toLowerCase().includes(term) ||
      goal.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }, [goals]);

  // Filter goals
  const filterGoals = useCallback((filters) => {
    let filtered = goals;

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(goal => goal.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(goal => goal.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(goal => goal.category === filters.category);
    }

    if (filters.dueDateRange) {
      const now = new Date();
      let endDate;

      switch (filters.dueDateRange) {
        case 'today':
          endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'week':
          endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          endDate = null;
      }

      if (endDate) {
        filtered = filtered.filter(goal => 
          new Date(goal.dueDate) >= now && new Date(goal.dueDate) <= endDate
        );
      }
    }

    return filtered;
  }, [goals]);

  // Sort goals
  const sortGoals = useCallback((goalsToSort, sortBy, sortOrder = 'asc') => {
    return [...goalsToSort].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  return {
    // State
    goals,
    recentGoals,
    goalCategories,
    isLoading,
    error,

    // CRUD Operations
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    updateGoalProgress,
    getGoalProgress,

    // Goal Actions
    toggleGoalStatus,
    duplicateGoal,
    archiveGoal,

    // Filtering & Searching
    getGoalsByStatus,
    getGoalsByCategory,
    getGoalsByPriority,
    getOverdueGoals,
    getUpcomingGoals,
    searchGoals,
    filterGoals,
    sortGoals,

    // Statistics
    getGoalStats,

    // Data refresh
    loadGoals
  };
};
