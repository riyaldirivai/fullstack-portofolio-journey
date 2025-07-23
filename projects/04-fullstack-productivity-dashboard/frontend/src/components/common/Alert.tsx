interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * Alert/Notification component for displaying messages to users
 */
const Alert = ({
  type = 'info',
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
  className,
  autoClose = false,
  autoCloseDelay = 5000
}: AlertProps) => {
  const typeConfig: Record<string, { bgClass: string; textClass: string; iconColor: string; icon: string }> = {
    success: {
      bgClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textClass: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-400',
      icon: '✓'
    },
    error: {
      bgClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textClass: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-400',
      icon: '✕'
    },
    warning: {
      bgClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textClass: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-400',
      icon: '⚠'
    },
    info: {
      bgClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-400',
      icon: 'ℹ'
    }
  };

  const config = typeConfig[type];

  const baseClasses = [
    'border',
    'rounded-lg',
    'p-4',
    'transition-all',
    'duration-300',
    'ease-in-out',
    config.bgClass,
    config.textClass
  ];

  const alertClasses = [
    ...baseClasses,
    className || ''
  ].filter(Boolean).join(' ');

  // Auto close functionality
  let autoCloseTimeout: any = null;
  if (autoClose && onDismiss) {
    autoCloseTimeout = setTimeout(() => {
      onDismiss();
    }, autoCloseDelay);
  }

  const handleDismiss = () => {
    if (autoCloseTimeout) {
      clearTimeout(autoCloseTimeout);
    }
    onDismiss?.();
  };

  const alertHTML = `
    <div class="alert ${alertClasses}" role="alert" data-type="${type}">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="${config.iconColor} text-lg font-bold">
            ${config.icon}
          </span>
        </div>
        
        <div class="ml-3 flex-1">
          ${title ? `
            <h3 class="text-sm font-medium mb-1">
              ${title}
            </h3>
          ` : ''}
          
          <div class="text-sm">
            ${message}
          </div>
          
          ${action ? `
            <div class="mt-3">
              <button 
                class="alert-action-btn text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent"
                data-action="true"
              >
                ${action.label}
              </button>
            </div>
          ` : ''}
        </div>
        
        ${dismissible ? `
          <div class="ml-auto pl-3">
            <button 
              class="alert-dismiss-btn inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent rounded-md p-1.5"
              data-dismiss="true"
            >
              <span class="sr-only">Dismiss</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  return {
    type: 'alert-component',
    html: alertHTML,
    props: {
      type,
      title,
      message,
      dismissible,
      onDismiss: handleDismiss,
      action,
      autoClose,
      autoCloseDelay,
      autoCloseTimeout
    }
  };
};

export default Alert;
