/**
 * Custom Hook: useNotifications
 * Manages in-app notifications, push notifications, and notification preferences
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { notificationService } from '../services/api/notificationService';
import { useAuth } from './useAuth';

// Notification Context
const NotificationContext = createContext(null);

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [preferences, setPreferences] = useState({
    browser: true,
    email: true,
    goalReminders: true,
    timerComplete: true,
    achievements: true,
    weeklyReport: true
  });

  // Check notification support on mount
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      loadPreferences();
      setupWebSocketConnection();
    }
  }, [isAuthenticated, user]);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Load notification preferences
  const loadPreferences = useCallback(async () => {
    try {
      const userPreferences = await notificationService.getPreferences();
      setPreferences({ ...preferences, ...userPreferences });
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Setup WebSocket connection for real-time notifications
  const setupWebSocketConnection = useCallback(() => {
    if (!user) return;

    try {
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/notifications`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('📡 Connected to notification service');
        // Send authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: localStorage.getItem('token')
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            handleRealtimeNotification(data.data);
          }
        } catch (error) {
          console.error('Failed to parse notification:', error);
        }
      };

      ws.onclose = () => {
        console.log('📡 Disconnected from notification service');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocketConnection, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => {
        ws.close();
      };
    } catch (error) {
      console.error('Failed to setup WebSocket connection:', error);
    }
  }, [user]);

  // Handle realtime notification
  const handleRealtimeNotification = useCallback((notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show browser notification if enabled
    if (preferences.browser && permission === 'granted') {
      showBrowserNotification(notification);
    }

    // Show in-app toast
    showToastNotification(notification);
  }, [preferences.browser, permission]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Navigate to relevant page if URL provided
        if (notification.url) {
          window.location.href = notification.url;
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [isSupported, permission]);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Show toast notification
  const showToastNotification = useCallback((notification) => {
    const toast = {
      id: notification.id || Date.now(),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      duration: notification.duration || 4000,
      timestamp: new Date()
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration);
  }, []);

  // Remove toast
  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  // Show notification (programmatic)
  const showNotification = useCallback((notification) => {
    showToastNotification({
      ...notification,
      id: Date.now()
    });
  }, [showToastNotification]);

  // Request permission for browser notifications
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      return 'not-supported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'error';
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
      });

      await notificationService.subscribeToPush(subscription);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }, [isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await notificationService.unsubscribeFromPush();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Clear notification
  const clearNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.clearNotification(notificationId);
      
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('Failed to clear notification:', error);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, []);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      const updated = await notificationService.updatePreferences({
        ...preferences,
        ...newPreferences
      });
      
      setPreferences(updated);
      
      // If browser notifications were disabled, unsubscribe from push
      if (!newPreferences.browser && preferences.browser) {
        await unsubscribeFromPush();
      }
      
      // If browser notifications were enabled, subscribe to push
      if (newPreferences.browser && !preferences.browser) {
        if (permission === 'granted') {
          await subscribeToPush();
        } else {
          await requestPermission();
        }
      }
      
      return updated;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }, [preferences, subscribeToPush, unsubscribeFromPush, permission, requestPermission]);

  // Test notification
  const testNotification = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from your productivity dashboard!',
      duration: 3000
    });
  }, [showNotification]);

  // Get notification by ID
  const getNotification = useCallback((notificationId) => {
    return notifications.find(notif => notif.id === notificationId);
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.read);
  }, [notifications]);

  const value = {
    // State
    notifications,
    toasts,
    unreadCount,
    preferences,
    isSupported,
    permission,

    // Toast actions
    showNotification,
    removeToast,

    // Notification actions
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,

    // Browser notification actions
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,

    // Preferences
    updatePreferences,

    // Utilities
    testNotification,
    getNotification,
    getNotificationsByType,
    getUnreadNotifications,

    // Data refresh
    loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook for specific notification types
export const useTimerNotifications = () => {
  const { showNotification } = useNotifications();

  const notifyTimerStart = useCallback((duration) => {
    showNotification({
      type: 'info',
      title: 'Timer Started ⏰',
      message: `${Math.floor(duration / 60)} minute session started. Stay focused!`,
      duration: 3000
    });
  }, [showNotification]);

  const notifyTimerComplete = useCallback((sessionType) => {
    showNotification({
      type: 'success',
      title: 'Session Complete! 🎉',
      message: `Great job! You completed a ${sessionType} session.`,
      duration: 5000
    });
  }, [showNotification]);

  const notifyBreakTime = useCallback((breakType) => {
    showNotification({
      type: 'info',
      title: 'Break Time! ☕',
      message: `Time for a ${breakType}. You've earned it!`,
      duration: 4000
    });
  }, [showNotification]);

  return {
    notifyTimerStart,
    notifyTimerComplete,
    notifyBreakTime
  };
};

// Hook for goal notifications
export const useGoalNotifications = () => {
  const { showNotification } = useNotifications();

  const notifyGoalCreated = useCallback((goalTitle) => {
    showNotification({
      type: 'success',
      title: 'Goal Created! 🎯',
      message: `"${goalTitle}" has been added to your goals.`,
      duration: 3000
    });
  }, [showNotification]);

  const notifyGoalCompleted = useCallback((goalTitle) => {
    showNotification({
      type: 'success',
      title: 'Goal Completed! 🏆',
      message: `Congratulations! You completed "${goalTitle}".`,
      duration: 5000
    });
  }, [showNotification]);

  const notifyGoalDeadline = useCallback((goalTitle, daysLeft) => {
    showNotification({
      type: 'warning',
      title: 'Goal Deadline Approaching 📅',
      message: `"${goalTitle}" is due in ${daysLeft} days.`,
      duration: 4000
    });
  }, [showNotification]);

  const notifyMilestone = useCallback((goalTitle, milestone) => {
    showNotification({
      type: 'success',
      title: `${milestone}% Progress! 🎯`,
      message: `Great work on "${goalTitle}"!`,
      duration: 3000
    });
  }, [showNotification]);

  return {
    notifyGoalCreated,
    notifyGoalCompleted,
    notifyGoalDeadline,
    notifyMilestone
  };
};
