/**
 * ===========================================
 * PRODUCTIVITY DASHBOARD - MAIN APPLICATION
 * Integrated with Real Backend API Server
 * Author: riyaldirivai
 * Date: 2025-07-11
 * ===========================================
 */

// Import API Service (single source of truth for all API calls)
import apiService from './services/apiService.js';
import envConfig from './config/environment.js';

/**
 * 🎯 MAIN APPLICATION CLASS
 * Orchestrates the entire dashboard application
 */
class ProductivityDashboard {
  constructor() {
    this.api = apiService;
    this.env = envConfig;
    this.currentUser = null;
    this.isInitialized = false;
    
    // Application state
    this.state = {
      goals: [],
      activeTimer: null,
      recentActivities: [],
      dashboardStats: {},
      isLoading: false,
      error: null
    };

    // Event listeners registry
    this.eventListeners = new Map();
    
    // Initialize application
    this.init();
  }

  /**
   * 🚀 APPLICATION INITIALIZATION
   * Sets up the entire application and checks authentication
   */
  async init() {
    try {
      this.showLoading('Initializing dashboard...');
      
      // 1. Check backend health
      await this.checkBackendHealth();
      
      // 2. Check authentication status
      if (this.api.isAuthenticated()) {
        await this.loadUserSession();
      } else {
        this.showAuthRequired();
        return;
      }
      
      // 3. Initialize UI components
      this.initializeUI();
      
      // 4. Load initial data
      await this.loadDashboardData();
      
      // 5. Set up real-time updates
      this.setupRealTimeUpdates();
      
      // 6. Mark as initialized
      this.isInitialized = true;
      
      this.hideLoading();
      this.env.log('info', 'Dashboard initialized successfully');
      
    } catch (error) {
      this.env.log('error', 'Failed to initialize dashboard:', error);
      this.showError('Failed to initialize dashboard. Please refresh the page.');
    }
  }

  /**
   * 🏥 BACKEND HEALTH CHECK
   * Verifies that the backend server is running and accessible
   */
  async checkBackendHealth() {
    try {
      const health = await this.api.healthCheck();
      this.env.log('info', 'Backend health check passed:', health);
      
      if (health.status !== 'OK') {
        throw new Error('Backend server is not healthy');
      }
    } catch (error) {
      this.env.log('error', 'Backend health check failed:', error);
      throw new Error('Unable to connect to backend server. Please ensure the server is running.');
    }
  }

  /**
   * 👤 USER SESSION MANAGEMENT
   * Loads and validates user session
   */
  async loadUserSession() {
    try {
      // Get user profile from backend
      const response = await this.api.auth.getProfile();
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.updateUserDisplay();
        this.env.log('info', 'User session loaded:', this.currentUser);
      } else {
        throw new Error('Failed to load user session');
      }
    } catch (error) {
      this.env.log('error', 'Failed to load user session:', error);
      // Clear invalid session
      await this.api.logout();
      this.showAuthRequired();
      throw error;
    }
  }

  /**
   * 🎨 UI INITIALIZATION
   * Sets up all UI components and event listeners
   */
  initializeUI() {
    // Remove all existing event listeners to prevent duplicates
    this.removeAllEventListeners();
    
    // Initialize authentication UI
    this.initAuthUI();
    
    // Initialize goals UI
    this.initGoalsUI();
    
    // Initialize timer UI
    this.initTimerUI();
    
    // Initialize dashboard UI
    this.initDashboardUI();
    
    // Set up navigation
    this.initNavigation();
    
    this.env.log('debug', 'UI components initialized');
  }

  /**
   * 🔐 AUTHENTICATION UI
   * Handles login, logout, and registration forms
   */
  initAuthUI() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      this.addEventListener(loginForm, 'submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(new FormData(loginForm));
      });
    }

    // Registration form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      this.addEventListener(registerForm, 'submit', async (e) => {
        e.preventDefault();
        await this.handleRegistration(new FormData(registerForm));
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      this.addEventListener(logoutBtn, 'click', async () => {
        await this.handleLogout();
      });
    }

    // Show/hide auth forms
    const showLoginBtn = document.getElementById('showLogin');
    const showRegisterBtn = document.getElementById('showRegister');
    
    if (showLoginBtn) {
      this.addEventListener(showLoginBtn, 'click', () => this.showLoginForm());
    }
    
    if (showRegisterBtn) {
      this.addEventListener(showRegisterBtn, 'click', () => this.showRegisterForm());
    }
  }

  /**
   * 🎯 GOALS UI
   * Manages goal creation, editing, and progress tracking
   */
  initGoalsUI() {
    // Goal creation form
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
      this.addEventListener(goalForm, 'submit', async (e) => {
        e.preventDefault();
        await this.handleGoalCreation(new FormData(goalForm));
      });
    }

    // Goal list interactions
    const goalsList = document.getElementById('goalsList');
    if (goalsList) {
      this.addEventListener(goalsList, 'click', async (e) => {
        await this.handleGoalAction(e);
      });
    }

    // Refresh goals button
    const refreshGoalsBtn = document.getElementById('refreshGoals');
    if (refreshGoalsBtn) {
      this.addEventListener(refreshGoalsBtn, 'click', async () => {
        await this.loadGoals();
      });
    }
  }

  /**
   * ⏰ TIMER UI
   * Handles timer controls and pomodoro functionality
   */
  initTimerUI() {
    // Timer control buttons
    const startTimerBtn = document.getElementById('startTimer');
    const pauseTimerBtn = document.getElementById('pauseTimer');
    const stopTimerBtn = document.getElementById('stopTimer');

    if (startTimerBtn) {
      this.addEventListener(startTimerBtn, 'click', async () => {
        await this.handleStartTimer();
      });
    }

    if (pauseTimerBtn) {
      this.addEventListener(pauseTimerBtn, 'click', async () => {
        await this.handlePauseTimer();
      });
    }

    if (stopTimerBtn) {
      this.addEventListener(stopTimerBtn, 'click', async () => {
        await this.handleStopTimer();
      });
    }

    // Timer type selection
    const timerTypeSelect = document.getElementById('timerType');
    if (timerTypeSelect) {
      this.addEventListener(timerTypeSelect, 'change', (e) => {
        this.updateTimerTypeSettings(e.target.value);
      });
    }
  }

  /**
   * 📊 DASHBOARD UI
   * Sets up dashboard analytics and activity feeds
   */
  initDashboardUI() {
    // Refresh dashboard button
    const refreshDashboardBtn = document.getElementById('refreshDashboard');
    if (refreshDashboardBtn) {
      this.addEventListener(refreshDashboardBtn, 'click', async () => {
        await this.loadDashboardData();
      });
    }

    // Time range selector for analytics
    const timeRangeSelect = document.getElementById('timeRange');
    if (timeRangeSelect) {
      this.addEventListener(timeRangeSelect, 'change', async (e) => {
        await this.loadProductivityMetrics(parseInt(e.target.value));
      });
    }
  }

  /**
   * 🧭 NAVIGATION
   * Sets up navigation between different sections
   */
  initNavigation() {
    const navButtons = document.querySelectorAll('[data-section]');
    navButtons.forEach(button => {
      this.addEventListener(button, 'click', () => {
        this.showSection(button.dataset.section);
      });
    });
  }

  /**
   * 📡 LOAD DASHBOARD DATA
   * Fetches all necessary data from the backend
   */
  async loadDashboardData() {
    try {
      this.setState({ isLoading: true });
      
      // Load data in parallel for better performance
      const [
        goalsResponse,
        dashboardResponse,
        activitiesResponse,
        activeTimerResponse
      ] = await Promise.all([
        this.api.goals.getGoals(),
        this.api.dashboard.getAnalytics(),
        this.api.dashboard.getRecentActivities(10),
        this.api.timer.getActiveTimer().catch(() => ({ success: false })) // Timer might not exist
      ]);

      // Update state with loaded data
      if (goalsResponse.success) {
        this.setState({ goals: goalsResponse.data.goals });
        this.renderGoals();
      }

      if (dashboardResponse.success) {
        this.setState({ dashboardStats: dashboardResponse.data });
        this.renderDashboardStats();
      }

      if (activitiesResponse.success) {
        this.setState({ recentActivities: activitiesResponse.data.activities });
        this.renderRecentActivities();
      }

      if (activeTimerResponse.success && activeTimerResponse.data.session) {
        this.setState({ activeTimer: activeTimerResponse.data.session });
        this.renderActiveTimer();
      }

      this.env.log('info', 'Dashboard data loaded successfully');
      
    } catch (error) {
      this.env.log('error', 'Failed to load dashboard data:', error);
      this.showError('Failed to load dashboard data. Please try again.');
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * 🎯 GOAL MANAGEMENT METHODS
   */
  async loadGoals() {
    try {
      const response = await this.api.goals.getGoals();
      if (response.success) {
        this.setState({ goals: response.data.goals });
        this.renderGoals();
      }
    } catch (error) {
      this.env.log('error', 'Failed to load goals:', error);
      this.showError('Failed to load goals. Please try again.');
    }
  }

  async handleGoalCreation(formData) {
    try {
      this.showLoading('Creating goal...');
      
      const goalData = {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        targetValue: parseInt(formData.get('targetValue')),
        unit: formData.get('unit'),
        deadline: formData.get('deadline')
      };

      const response = await this.api.goals.createGoal(goalData);
      
      if (response.success) {
        this.showSuccess('Goal created successfully!');
        await this.loadGoals(); // Refresh goals list
        document.getElementById('goalForm').reset();
      }
      
    } catch (error) {
      this.env.log('error', 'Failed to create goal:', error);
      this.showError('Failed to create goal. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleGoalAction(event) {
    const action = event.target.dataset.action;
    const goalId = event.target.dataset.goalId;
    
    if (!action || !goalId) return;

    try {
      switch (action) {
        case 'update-progress':
          await this.updateGoalProgress(goalId);
          break;
        case 'edit':
          this.showGoalEditForm(goalId);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this goal?')) {
            await this.deleteGoal(goalId);
          }
          break;
      }
    } catch (error) {
      this.env.log('error', 'Goal action failed:', error);
      this.showError('Action failed. Please try again.');
    }
  }

  /**
   * ⏰ TIMER MANAGEMENT METHODS
   */
  async handleStartTimer() {
    try {
      // Check if there's already an active timer
      if (this.state.activeTimer) {
        this.showError('There is already an active timer. Please stop it first.');
        return;
      }

      const timerType = document.getElementById('timerType')?.value || 'pomodoro';
      const goalId = document.getElementById('timerGoal')?.value;
      const title = document.getElementById('timerTitle')?.value || 'Focus Session';

      const timerData = {
        type: timerType,
        title,
        plannedDuration: this.getTimerDuration(timerType),
        goalId: goalId || null
      };

      const response = await this.api.timer.startTimer(timerData);
      
      if (response.success) {
        this.setState({ activeTimer: response.data.session });
        this.renderActiveTimer();
        this.startTimerTick();
        this.showSuccess('Timer started successfully!');
      }
      
    } catch (error) {
      this.env.log('error', 'Failed to start timer:', error);
      this.showError('Failed to start timer. Please try again.');
    }
  }

  async handlePauseTimer() {
    try {
      if (!this.state.activeTimer) {
        this.showError('No active timer to pause.');
        return;
      }

      const response = await this.api.timer.pauseTimer();
      
      if (response.success) {
        this.setState({ 
          activeTimer: { 
            ...this.state.activeTimer, 
            status: 'paused' 
          } 
        });
        this.renderActiveTimer();
        this.stopTimerTick();
        this.showSuccess('Timer paused.');
      }
      
    } catch (error) {
      this.env.log('error', 'Failed to pause timer:', error);
      this.showError('Failed to pause timer. Please try again.');
    }
  }

  async handleStopTimer() {
    try {
      if (!this.state.activeTimer) {
        this.showError('No active timer to stop.');
        return;
      }

      // Get productivity rating from user
      const rating = this.getProductivityRating();
      const notes = document.getElementById('sessionNotes')?.value || '';

      const response = await this.api.timer.stopTimer({ rating, notes });
      
      if (response.success) {
        this.setState({ activeTimer: null });
        this.renderActiveTimer();
        this.stopTimerTick();
        await this.loadDashboardData(); // Refresh dashboard
        this.showSuccess('Timer stopped and session saved!');
      }
      
    } catch (error) {
      this.env.log('error', 'Failed to stop timer:', error);
      this.showError('Failed to stop timer. Please try again.');
    }
  }

  /**
   * 🔐 AUTHENTICATION METHODS
   */
  async handleLogin(formData) {
    try {
      this.showLoading('Logging in...');
      
      const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      const response = await this.api.auth.login(credentials);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.showSuccess('Login successful!');
        await this.init(); // Reinitialize dashboard
      }
      
    } catch (error) {
      this.env.log('error', 'Login failed:', error);
      this.showError('Login failed. Please check your credentials.');
    } finally {
      this.hideLoading();
    }
  }

  async handleRegistration(formData) {
    try {
      this.showLoading('Creating account...');
      
      const userData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password')
      };

      const response = await this.api.auth.register(userData);
      
      if (response.success) {
        this.currentUser = response.data.user;
        this.showSuccess('Account created successfully!');
        await this.init(); // Initialize dashboard
      }
      
    } catch (error) {
      this.env.log('error', 'Registration failed:', error);
      this.showError('Registration failed. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleLogout() {
    try {
      await this.api.logout();
      this.currentUser = null;
      this.setState({
        goals: [],
        activeTimer: null,
        recentActivities: [],
        dashboardStats: {}
      });
      this.showAuthRequired();
      this.showSuccess('Logged out successfully.');
    } catch (error) {
      this.env.log('error', 'Logout failed:', error);
      // Continue with logout even if API call fails
      this.showAuthRequired();
    }
  }

  /**
   * 🎨 UI RENDERING METHODS
   */
  renderGoals() {
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;

    if (this.state.goals.length === 0) {
      goalsList.innerHTML = '<p class="no-data">No goals yet. Create your first goal!</p>';
      return;
    }

    goalsList.innerHTML = this.state.goals.map(goal => `
      <div class="goal-item" data-goal-id="${goal._id}">
        <div class="goal-header">
          <h3>${goal.title}</h3>
          <span class="goal-priority ${goal.priority}">${goal.priority}</span>
        </div>
        <p class="goal-description">${goal.description}</p>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(goal.currentProgress / goal.targetValue) * 100}%"></div>
          </div>
          <span class="progress-text">${goal.currentProgress}/${goal.targetValue} ${goal.unit}</span>
        </div>
        <div class="goal-actions">
          <button data-action="update-progress" data-goal-id="${goal._id}">Update Progress</button>
          <button data-action="edit" data-goal-id="${goal._id}">Edit</button>
          <button data-action="delete" data-goal-id="${goal._id}" class="danger">Delete</button>
        </div>
      </div>
    `).join('');
  }

  renderActiveTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;

    if (!this.state.activeTimer) {
      timerDisplay.innerHTML = '<p class="no-timer">No active timer</p>';
      return;
    }

    const timer = this.state.activeTimer;
    timerDisplay.innerHTML = `
      <div class="active-timer">
        <h3>${timer.title}</h3>
        <div class="timer-time" id="timerTime">00:00</div>
        <div class="timer-controls">
          <button id="pauseTimer" ${timer.status === 'paused' ? 'style="display:none"' : ''}>Pause</button>
          <button id="resumeTimer" ${timer.status === 'running' ? 'style="display:none"' : ''}>Resume</button>
          <button id="stopTimer" class="danger">Stop</button>
        </div>
        <div class="timer-status">Status: ${timer.status}</div>
      </div>
    `;

    // Re-attach event listeners for new buttons
    this.initTimerUI();

    // Start timer tick if running
    if (timer.status === 'running') {
      this.startTimerTick();
    }
  }

  renderDashboardStats() {
    const stats = this.state.dashboardStats;
    
    // Update stats cards
    this.updateStatsCard('totalGoals', stats.goals?.total || 0);
    this.updateStatsCard('activeGoals', stats.goals?.active || 0);
    this.updateStatsCard('completedGoals', stats.goals?.completed || 0);
    this.updateStatsCard('totalTimeTracked', this.formatTime(stats.timer?.totalTimeSpent || 0));
  }

  renderRecentActivities() {
    const activitiesList = document.getElementById('recentActivities');
    if (!activitiesList) return;

    if (this.state.recentActivities.length === 0) {
      activitiesList.innerHTML = '<p class="no-data">No recent activities</p>';
      return;
    }

    activitiesList.innerHTML = this.state.recentActivities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}"></div>
        <div class="activity-content">
          <h4>${activity.title}</h4>
          <p class="activity-time">${this.formatRelativeTime(activity.timestamp)}</p>
        </div>
        <span class="activity-status ${activity.status}">${activity.status}</span>
      </div>
    `).join('');
  }

  /**
   * 🔄 REAL-TIME UPDATES
   * Sets up polling for real-time data updates
   */
  setupRealTimeUpdates() {
    // Poll for active timer updates every 30 seconds
    this.timerUpdateInterval = setInterval(async () => {
      if (this.state.activeTimer) {
        try {
          const response = await this.api.timer.getActiveTimer();
          if (response.success && response.data.session) {
            this.setState({ activeTimer: response.data.session });
          } else {
            // Timer no longer active
            this.setState({ activeTimer: null });
            this.stopTimerTick();
          }
        } catch (error) {
          this.env.log('debug', 'Timer update failed:', error);
        }
      }
    }, 30000);

    // Poll for dashboard updates every 2 minutes
    this.dashboardUpdateInterval = setInterval(async () => {
      try {
        const response = await this.api.dashboard.getAnalytics();
        if (response.success) {
          this.setState({ dashboardStats: response.data });
          this.renderDashboardStats();
        }
      } catch (error) {
        this.env.log('debug', 'Dashboard update failed:', error);
      }
    }, 120000);
  }

  /**
   * 🔧 UTILITY METHODS
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  showLoading(message = 'Loading...') {
    const loadingElement = document.getElementById('loadingScreen');
    const loadingText = document.getElementById('loadingText');
    
    if (loadingElement) {
      loadingElement.classList.remove('hidden');
      if (loadingText) loadingText.textContent = message;
    }
  }

  hideLoading() {
    const loadingElement = document.getElementById('loadingScreen');
    if (loadingElement) {
      loadingElement.classList.add('hidden');
    }
  }

  showError(message) {
    // Implement toast notification or alert
    console.error(message);
    alert(message); // Temporary - replace with better UI
  }

  showSuccess(message) {
    // Implement toast notification
    console.log(message);
    // alert(message); // Temporary - replace with better UI
  }

  showAuthRequired() {
    // Show login/register form
    document.getElementById('authSection')?.classList.remove('hidden');
    document.getElementById('dashboardSection')?.classList.add('hidden');
  }

  formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatRelativeTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  addEventListener(element, event, handler) {
    element.addEventListener(event, handler);
    
    // Store for cleanup
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, []);
    }
    this.eventListeners.get(element).push({ event, handler });
  }

  removeAllEventListeners() {
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(({ event, handler }) => {
        element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
  }

  /**
   * 🏁 CLEANUP
   * Clean up resources when component is destroyed
   */
  destroy() {
    this.removeAllEventListeners();
    
    if (this.timerUpdateInterval) {
      clearInterval(this.timerUpdateInterval);
    }
    
    if (this.dashboardUpdateInterval) {
      clearInterval(this.dashboardUpdateInterval);
    }
    
    if (this.timerTickInterval) {
      clearInterval(this.timerTickInterval);
    }
  }
}

/**
 * 🚀 APPLICATION STARTUP
 * Initialize the dashboard when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  // Create global dashboard instance
  window.dashboard = new ProductivityDashboard();
  
  // Handle page unload cleanup
  window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
      window.dashboard.destroy();
    }
  });
});

// Export for module systems
export default ProductivityDashboard;
