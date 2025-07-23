/**
 * Authentication Components
 * 
 * React components for authentication flow:
 * Login Form → Validate Credentials → Generate JWT Token → Store Token
 */

import React, { useState, useEffect } from 'react';
import { AuthFlow, authUtils, LoginCredentials, RegisterData } from './authFlow';
import { useSelector } from 'react-redux';

// ========================================
// 🔑 LOGIN COMPONENT
// ========================================

export interface LoginFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/dashboard'
}) => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get auth state from Redux
  const isLoading = authUtils.isLoading('AUTH_LOGIN');
  const authError = authUtils.getError('AUTH_LOGIN');

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email wajib diisi';
    } else if (!authUtils.isValidEmail(formData.email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.group('🔑 Login Form Submission');
      console.log('Step 1: Form validation passed');
      console.log('Step 2: Calling AuthFlow.login...');

      const result = await AuthFlow.login(formData);

      if (result.success && result.user) {
        console.log('Step 3: ✅ Login successful');
        console.groupEnd();

        // Call success callback
        if (onSuccess) {
          onSuccess(result.user);
        }

        // Redirect to intended page
        const redirectPath = sessionStorage.getItem('redirect_after_login') || redirectTo;
        sessionStorage.removeItem('redirect_after_login');
        window.location.href = redirectPath;

      } else {
        console.log('Step 3: ❌ Login failed:', result.error);
        console.groupEnd();

        if (onError) {
          onError(result.error || 'Login gagal');
        }
      }
    } catch (error) {
      console.error('❌ Login form error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Clear auth error when component unmounts
  useEffect(() => {
    return () => {
      authUtils.clearError('AUTH_LOGIN');
    };
  }, []);

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2 className="form-title">Masuk ke Akun Anda</h2>
        <p className="form-subtitle">Silakan masuk untuk melanjutkan</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="nama@email.com"
              disabled={isLoading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder="Masukkan password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {/* Remember Me */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="checkbox-text">Ingat saya</span>
            </label>
          </div>

          {/* Auth Error */}
          {authError && (
            <div className="error-alert">
              <span className="error-icon">❌</span>
              <span>{authUtils.formatAuthError(authError)}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⏳</span>
                Sedang masuk...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="form-footer">
          <a href="/forgot-password" className="forgot-password-link">
            Lupa password?
          </a>
          <p className="signup-link">
            Belum punya akun?{' '}
            <a href="/register">Daftar sekarang</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 📝 REGISTER COMPONENT
// ========================================

export interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/dashboard'
}) => {
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  const isLoading = authUtils.isLoading('AUTH_REGISTER');
  const authError = authUtils.getError('AUTH_REGISTER');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Update password strength
    if (name === 'password') {
      setPasswordStrength(authUtils.checkPasswordStrength(value));
    }

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nama minimal 2 karakter';
    }

    if (!formData.email) {
      errors.email = 'Email wajib diisi';
    } else if (!authUtils.isValidEmail(formData.email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      errors.password = 'Password wajib diisi';
    } else if (formData.password.length < 8) {
      errors.password = 'Password minimal 8 karakter';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi password wajib diisi';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Password tidak cocok';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.group('📝 Register Form Submission');
      console.log('Step 1: Form validation passed');
      console.log('Step 2: Calling AuthFlow.register...');

      const result = await AuthFlow.register(formData);

      if (result.success && result.user) {
        console.log('Step 3: ✅ Registration successful');
        console.groupEnd();

        if (onSuccess) {
          onSuccess(result.user);
        }

        // Redirect to dashboard
        window.location.href = redirectTo;

      } else {
        console.log('Step 3: ❌ Registration failed:', result.error);
        console.groupEnd();

        if (onError) {
          onError(result.error || 'Registrasi gagal');
        }
      }
    } catch (error) {
      console.error('❌ Register form error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <div className="register-form-container">
      <div className="register-form">
        <h2 className="form-title">Buat Akun Baru</h2>
        <p className="form-subtitle">Bergabunglah dengan kami hari ini</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${validationErrors.name ? 'error' : ''}`}
              placeholder="Nama lengkap Anda"
              disabled={isLoading}
              autoComplete="name"
            />
            {validationErrors.name && (
              <span className="error-message">{validationErrors.name}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="nama@email.com"
              disabled={isLoading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'error' : ''}`}
                placeholder="Masukkan password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill strength-${passwordStrength.score}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="strength-feedback">
                  {passwordStrength.feedback.length > 0 && (
                    <ul>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>{feedback}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Konfirmasi Password
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
                placeholder="Ulangi password"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className="error-message">{validationErrors.confirmPassword}</span>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
              />
              <span className="checkbox-text">
                Saya setuju dengan{' '}
                <a href="/terms" target="_blank">Syarat & Ketentuan</a>{' '}
                dan <a href="/privacy" target="_blank">Kebijakan Privasi</a>
              </span>
            </label>
          </div>

          {/* Auth Error */}
          {authError && (
            <div className="error-alert">
              <span className="error-icon">❌</span>
              <span>{authUtils.formatAuthError(authError)}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⏳</span>
                Sedang mendaftar...
              </>
            ) : (
              'Daftar Sekarang'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="form-footer">
          <p className="signin-link">
            Sudah punya akun?{' '}
            <a href="/login">Masuk di sini</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================
// 🛡️ PROTECTED ROUTE COMPONENT
// ========================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback = <div>Loading...</div>,
  redirectTo = '/login'
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🛡️ ProtectedRoute: Checking authorization...', { requiredRole });

      try {
        const hasAccess = await AuthGuard.canAccess(requiredRole);
        setIsAuthorized(hasAccess);

        if (!hasAccess) {
          console.log('❌ Access denied, redirecting to:', redirectTo);
          // Store current path for redirect after login
          sessionStorage.setItem('redirect_after_login', window.location.pathname);
          window.location.href = redirectTo;
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        setIsAuthorized(false);
        window.location.href = redirectTo;
      }
    };

    checkAuth();
  }, [requiredRole, redirectTo]);

  if (isAuthorized === null) {
    return <>{fallback}</>;
  }

  if (isAuthorized === false) {
    return null; // Will redirect
  }

  return <>{children}</>;
};

// ========================================
// 🔐 AUTH STATUS COMPONENT
// ========================================

export const AuthStatus: React.FC = () => {
  const [user, setUser] = useState(AuthFlow.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(AuthFlow.isAuthenticated());

  useEffect(() => {
    const checkAuthStatus = () => {
      setUser(AuthFlow.getCurrentUser());
      setIsAuthenticated(AuthFlow.isAuthenticated());
    };

    // Check every second
    const interval = setInterval(checkAuthStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await AuthFlow.logout();
    window.location.href = '/login';
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="auth-status unauthenticated">
        <span>Belum login</span>
        <a href="/login" className="login-link">Masuk</a>
      </div>
    );
  }

  return (
    <div className="auth-status authenticated">
      <div className="user-info">
        <span className="user-name">{user.name}</span>
        <span className="user-email">{user.email}</span>
        {user.role && <span className="user-role">{user.role}</span>}
      </div>
      <button onClick={handleLogout} className="logout-button">
        Keluar
      </button>
    </div>
  );
};

export { AuthFlow, AuthGuard, authUtils };
