import './styles/globals.css';
import App from './App';

/**
 * Application entry point
 * This file initializes the React application and mounts it to the DOM
 */

// Polyfills for older browsers
if (!window.Promise) {
  window.Promise = Promise;
}

// Initialize the application
function initializeApp() {
  try {
    // Get the root element
    const rootElement = document.getElementById('root');
    
    if (!rootElement) {
      throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
    }

    // Create app instance
    const app = new App(rootElement);
    
    // Make app instance globally available for debugging
    (window as any).app = app;
    
    console.log('🚀 Productivity Dashboard initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    
    // Show fallback error UI
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="min-h-screen bg-red-50 flex items-center justify-center">
          <div class="text-center max-w-md mx-auto p-6">
            <div class="text-red-500 text-6xl mb-4">💥</div>
            <h1 class="text-2xl font-bold text-red-900 mb-2">
              Startup Error
            </h1>
            <p class="text-red-700 mb-4">
              Failed to initialize the application.
            </p>
            <p class="text-sm text-red-600 mb-6">
              ${error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <button
              onclick="location.reload()"
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Hot Module Replacement (HMR) support for development
declare const module: any;
if (typeof module !== 'undefined' && module.hot) {
  module.hot.accept('./App', () => {
    console.log('🔄 Hot reloading App component...');
    initializeApp();
  });
}

// Service Worker registration for PWA functionality
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
if ('serviceWorker' in navigator && isProduction) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('❌ SW registration failed: ', registrationError);
      });
  });
}

// Performance monitoring
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isDevelopment) {
  // Log performance metrics in development
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0] as any;
      if (perfData) {
        console.log('📊 Performance Metrics:', {
          'DNS Lookup': `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
          'Connection': `${perfData.connectEnd - perfData.connectStart}ms`,
          'Request': `${perfData.responseStart - perfData.requestStart}ms`,
          'Response': `${perfData.responseEnd - perfData.responseStart}ms`,
          'DOM Content Loaded': `${perfData.domContentLoadedEventEnd - (perfData.navigationStart || 0)}ms`,
          'Load Complete': `${perfData.loadEventEnd - (perfData.navigationStart || 0)}ms`
        });
      }
    }, 0);
  });
}
