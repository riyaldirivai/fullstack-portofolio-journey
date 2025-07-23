interface AuthLayoutProps {
  children?: any;
  title?: string;
  subtitle?: string;
}

/**
 * Authentication layout component for login, register, and forgot password pages
 */
const AuthLayout = ({ 
  children, 
  title = 'Welcome Back', 
  subtitle = 'Sign in to your account to continue' 
}: AuthLayoutProps) => {
  
  const layoutHTML = `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <!-- Logo and Header -->
        <div class="text-center">
          <div class="flex justify-center">
            <div class="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span class="text-white font-bold text-2xl">P</span>
            </div>
          </div>
          <h1 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            ${title}
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            ${subtitle}
          </p>
        </div>

        <!-- Auth Form Card -->
        <div class="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <div id="auth-content">
            ${children || '<div class="text-center py-4">Loading...</div>'}
          </div>
        </div>

        <!-- Footer Links -->
        <div class="text-center">
          <div class="flex items-center justify-center space-x-4 text-sm">
            <a 
              href="/auth/login" 
              data-route="/auth/login"
              class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Sign In
            </a>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <a 
              href="/auth/register" 
              data-route="/auth/register"
              class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Create Account
            </a>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <a 
              href="/auth/forgot-password" 
              data-route="/auth/forgot-password"
              class="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Forgot Password
            </a>
          </div>
          
          <div class="mt-4">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Productivity Dashboard. All rights reserved.
            </p>
          </div>
        </div>

        <!-- Theme Toggle -->
        <div class="flex justify-center">
          <button 
            onclick="toggleTheme()"
            class="p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Toggle theme"
          >
            <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <script>
      function toggleTheme() {
        const root = document.documentElement;
        const isDark = root.classList.contains('dark');
        
        if (isDark) {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        } else {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        }
      }
    </script>
  `;

  return {
    type: 'auth-layout',
    html: layoutHTML,
    props: {
      title,
      subtitle
    }
  };
};

export default AuthLayout;
