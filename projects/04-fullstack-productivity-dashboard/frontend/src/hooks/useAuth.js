/**
 * Custom Hook: useAuth
 * Handles authentication state, login, logout, and user management
 */

import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api/authService';
import { storageService } from '../services/storageService';
import { useNotifications } from './useNotifications';

// Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = storageService.getToken();
        const storedRefreshToken = storageService.getRefreshToken();
        const storedUser = storageService.getUser();

        if (storedToken && storedUser) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(storedUser);
          setIsAuthenticated(true);

          // Verify token validity
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            // Token might be expired, try to refresh
            if (storedRefreshToken) {
              await refreshAuthToken();
            } else {
              await logout();
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password, rememberMe = false) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { user: userData, token: authToken, refreshToken: authRefreshToken } = response;

      // Update state
      setUser(userData);
      setToken(authToken);
      setRefreshToken(authRefreshToken);
      setIsAuthenticated(true);

      // Store in localStorage/sessionStorage
      storageService.setToken(authToken, rememberMe);
      if (authRefreshToken) {
        storageService.setRefreshToken(authRefreshToken, rememberMe);
      }
      storageService.setUser(userData, rememberMe);

      showNotification({
        type: 'success',
        title: 'Welcome back!',
        message: `Hello ${userData.name}, ready to be productive?`
      });

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      showNotification({
        type: 'error',
        title: 'Login Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Register function
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      const { user: newUser, token: authToken, refreshToken: authRefreshToken } = response;

      // Update state
      setUser(newUser);
      setToken(authToken);
      setRefreshToken(authRefreshToken);
      setIsAuthenticated(true);

      // Store in localStorage
      storageService.setToken(authToken);
      if (authRefreshToken) {
        storageService.setRefreshToken(authRefreshToken);
      }
      storageService.setUser(newUser);

      showNotification({
        type: 'success',
        title: 'Welcome to Productivity Dashboard!',
        message: 'Your account has been created successfully.'
      });

      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      showNotification({
        type: 'error',
        title: 'Registration Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);

      // Clear storage
      storageService.clearAuth();

      showNotification({
        type: 'info',
        title: 'Logged out',
        message: 'You have been logged out successfully.'
      });

      navigate('/login');
    }
  }, [token, navigate, showNotification]);

  // Refresh auth token
  const refreshAuthToken = useCallback(async () => {
    if (!refreshToken) {
      await logout();
      return null;
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      const { token: newToken, refreshToken: newRefreshToken } = response;

      setToken(newToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
        storageService.setRefreshToken(newRefreshToken);
      }
      storageService.setToken(newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return null;
    }
  }, [refreshToken, logout]);

  // Update user profile
  const updateUser = useCallback(async (updatedData) => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(updatedData);
      setUser(updatedUser);
      storageService.setUser(updatedUser);

      showNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully.'
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setIsLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });

      showNotification({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully.'
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      showNotification({
        type: 'error',
        title: 'Password Change Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Request password reset
  const requestPasswordReset = useCallback(async (email) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);

      showNotification({
        type: 'success',
        title: 'Reset Link Sent',
        message: 'Password reset instructions have been sent to your email.'
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset request failed';
      showNotification({
        type: 'error',
        title: 'Reset Request Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // Reset password with token
  const resetPassword = useCallback(async (token, newPassword) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);

      showNotification({
        type: 'success',
        title: 'Password Reset Successful',
        message: 'Your password has been reset. Please log in with your new password.'
      });

      navigate('/login');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      showNotification({
        type: 'error',
        title: 'Reset Failed',
        message
      });
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showNotification]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,
    token,

    // Actions
    login,
    register,
    logout,
    refreshAuthToken,
    updateUser,
    changePassword,
    requestPasswordReset,
    resetPassword,

    // Utilities
    hasRole,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        navigate('/login');
      }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
      return <div className="loading">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for role-based access
export const useRequireAuth = (requiredRole = null) => {
  const { isAuthenticated, user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, requiredRole, hasRole, navigate]);

  return isAuthenticated && (requiredRole ? hasRole(requiredRole) : true);
};
