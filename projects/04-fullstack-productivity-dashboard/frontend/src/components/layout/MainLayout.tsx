import { Loading } from '../common';

interface MainLayoutProps {
  children?: any;
  user?: any;
  onLogout?: () => void;
}

interface SidebarItem {
  path: string;
  label: string;
  icon: string;
  active?: boolean;
  badge?: string | number;
}

/**
 * Main layout component with sidebar, header, and content area
 */
const MainLayout = ({ children, user, onLogout }: MainLayoutProps) => {
  const sidebarItems: SidebarItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      active: window.location.pathname === '/dashboard'
    },
    {
      path: '/goals',
      label: 'Goals',
      icon: '🎯',
      active: window.location.pathname === '/goals'
    },
    {
      path: '/timer',
      label: 'Timer',
      icon: '⏱️',
      active: window.location.pathname === '/timer'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈',
      active: window.location.pathname === '/analytics'
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: '⚙️',
      active: window.location.pathname === '/settings'
    }
  ];

  const renderSidebarItem = (item: SidebarItem) => {
    return `
      <li>
        <a 
          href="${item.path}" 
          data-route="${item.path}"
          class="flex items-center p-3 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${item.active ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : ''}"
        >
          <span class="text-xl mr-3">${item.icon}</span>
          <span class="flex-1">${item.label}</span>
          ${item.badge ? `<span class="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">${item.badge}</span>` : ''}
        </a>
      </li>
    `;
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback logout logic
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
  };

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('-translate-x-full');
      overlay.classList.toggle('hidden');
    }
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const layoutHTML = `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <!-- Sidebar -->
      <div 
        id="sidebar"
        class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out"
      >
        <!-- Sidebar Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
              <span class="text-white font-bold text-lg">P</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              Productivity
            </h1>
          </div>
          <button 
            onclick="document.getElementById('sidebar').classList.add('-translate-x-full'); document.getElementById('sidebar-overlay').classList.add('hidden');"
            class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Sidebar Navigation -->
        <nav class="flex-1 p-4">
          <ul class="space-y-2">
            ${sidebarItems.map(renderSidebarItem).join('')}
          </ul>
        </nav>

        <!-- Sidebar Footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span class="text-gray-700 dark:text-gray-300 font-semibold">
                ${user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                ${user?.name || 'User'}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                ${user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <a 
              href="/profile" 
              data-route="/profile"
              class="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-center text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Profile
            </a>
            <button 
              onclick="app.logout()"
              class="flex-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar Overlay (Mobile) -->
      <div 
        id="sidebar-overlay"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden hidden"
        onclick="document.getElementById('sidebar').classList.add('-translate-x-full'); this.classList.add('hidden');"
      ></div>

      <!-- Main Content -->
      <div class="flex-1 lg:ml-64">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div class="flex items-center justify-between px-6 py-4">
            <!-- Mobile Menu Button -->
            <button 
              onclick="document.getElementById('sidebar').classList.remove('-translate-x-full'); document.getElementById('sidebar-overlay').classList.remove('hidden');"
              class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>

            <!-- Page Title -->
            <div class="flex-1 lg:flex-none">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                ${getPageTitle()}
              </h2>
            </div>

            <!-- Header Actions -->
            <div class="flex items-center space-x-4">
              <!-- Theme Toggle -->
              <button 
                onclick="app.toggleTheme()"
                class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Toggle theme"
              >
                <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <svg class="w-5 h-5 block dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                </svg>
              </button>

              <!-- Notifications -->
              <button 
                class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                title="Notifications"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <!-- Notification Badge -->
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="p-6">
          <div id="page-content">
            ${children || '<div class="text-center py-8">Loading content...</div>'}
          </div>
        </main>
      </div>
    </div>
  `;

  return {
    type: 'main-layout',
    html: layoutHTML,
    props: {
      user,
      onLogout,
      sidebarItems
    }
  };

  // Helper method to get page title based on current route
  function getPageTitle(): string {
    const path = window.location.pathname;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/goals': 'Goals',
      '/timer': 'Timer',
      '/analytics': 'Analytics',
      '/settings': 'Settings',
      '/profile': 'Profile'
    };
    return titles[path] || 'Productivity Dashboard';
  }
};

export default MainLayout;
