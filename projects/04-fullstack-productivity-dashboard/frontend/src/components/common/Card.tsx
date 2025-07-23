interface CardProps {
  children: any;
  title?: string;
  subtitle?: string;
  headerActions?: any;
  footer?: any;
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'small' | 'medium' | 'large';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hover?: boolean;
  clickable?: boolean;
  onClick?: (event: any) => void;
  className?: string;
}

/**
 * Card component with header, content, and footer sections
 */
const Card = ({
  children,
  title,
  subtitle,
  headerActions,
  footer,
  variant = 'default',
  size = 'medium',
  padding = 'medium',
  hover = false,
  clickable = false,
  onClick,
  className
}: CardProps) => {
  const variantClasses: Record<string, string> = {
    default: 'card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    outlined: 'card bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    elevated: 'card bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700',
    filled: 'card bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
  };

  const sizeClasses: Record<string, string> = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-lg'
  };

  const paddingClasses: Record<string, string> = {
    none: '',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const baseClasses = [
    'rounded-lg',
    'transition-all',
    'duration-200'
  ];

  const interactionClasses = [
    hover ? 'hover:shadow-md hover:-translate-y-1' : '',
    clickable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
  ];

  const cardClasses = [
    ...baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    paddingClasses[padding],
    ...interactionClasses,
    className || ''
  ].filter(Boolean).join(' ');

  const hasHeader = title || subtitle || headerActions;

  const cardHTML = `
    <div class="${cardClasses}" ${clickable && onClick ? 'data-clickable="true"' : ''}>
      ${hasHeader ? `
        <div class="card-header ${padding !== 'none' ? 'pb-4 mb-4 border-b border-gray-200 dark:border-gray-700' : ''}">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              ${title ? `
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  ${title}
                </h3>
              ` : ''}
              ${subtitle ? `
                <p class="text-sm text-gray-600 dark:text-gray-400 ${title ? 'mt-1' : ''}">
                  ${subtitle}
                </p>
              ` : ''}
            </div>
            ${headerActions ? `
              <div class="card-header-actions ml-4">
                ${headerActions}
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="card-content">
        ${typeof children === 'string' ? children : ''}
      </div>
      
      ${footer ? `
        <div class="card-footer ${padding !== 'none' ? 'pt-4 mt-4 border-t border-gray-200 dark:border-gray-700' : ''}">
          ${footer}
        </div>
      ` : ''}
    </div>
  `;

  return {
    type: 'card-component',
    html: cardHTML,
    props: {
      onClick: clickable ? onClick : undefined,
      variant,
      size,
      padding,
      hover,
      clickable
    }
  };
};

export default Card;
