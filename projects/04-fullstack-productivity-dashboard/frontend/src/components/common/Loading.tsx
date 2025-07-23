interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  fullscreen?: boolean;
  className?: string;
}

/**
 * Loading component with various animations and sizes
 */
const Loading = ({
  size = 'medium',
  type = 'spinner',
  text,
  fullscreen = false,
  className
}: LoadingProps) => {
  const sizeClasses: Record<string, string> = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses: Record<string, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const spinnerHTML = `
    <svg class="animate-spin ${sizeClasses[size]} text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  `;

  const dotsHTML = `
    <div class="flex space-x-1">
      <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
      <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
      <div class="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
    </div>
  `;

  const pulseHTML = `
    <div class="${sizeClasses[size]} bg-primary-600 rounded-full animate-pulse"></div>
  `;

  const skeletonHTML = `
    <div class="animate-pulse space-y-3">
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
    </div>
  `;

  const getLoadingAnimation = (): string => {
    switch (type) {
      case 'dots':
        return dotsHTML;
      case 'pulse':
        return pulseHTML;
      case 'skeleton':
        return skeletonHTML;
      case 'spinner':
      default:
        return spinnerHTML;
    }
  };

  const containerClasses = fullscreen 
    ? 'fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  const loadingHTML = `
    <div class="${containerClasses} ${className || ''}">
      <div class="flex flex-col items-center space-y-3">
        ${getLoadingAnimation()}
        ${text ? `<p class="${textSizeClasses[size]} text-gray-600 dark:text-gray-400 text-center">${text}</p>` : ''}
      </div>
    </div>
  `;

  return {
    type: 'loading-component',
    html: loadingHTML,
    props: {
      size,
      type,
      text,
      fullscreen
    }
  };
};

export default Loading;
