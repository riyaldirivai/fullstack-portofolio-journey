interface ButtonProps {
  children: any;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  onClick?: (event: any) => void;
  className?: string;
  [key: string]: any;
}

// Helper function to combine CSS classes
function combineClasses(...classes: (string | string[] | undefined | null | boolean)[]): string {
  const result: string[] = [];
  
  for (const cls of classes) {
    if (cls) {
      if (typeof cls === 'string') {
        result.push(cls);
      } else if (Array.isArray(cls)) {
        result.push(...cls);
      }
    }
  }
  
  return result.join(' ');
}

/**
 * Button component with multiple variants and sizes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  type = 'button',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onClick,
  className,
  ...props
}: ButtonProps) => {
  const baseClasses = [
    'btn', // Use existing btn class from globals.css
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200'
  ];

  const variantClassesMap: Record<string, string[]> = {
    primary: ['btn-primary'],
    secondary: ['btn-secondary'],
    outline: ['btn-outline'],
    ghost: ['btn-ghost'],
    link: ['btn-link']
  };

  const sizeClassesMap: Record<string, string[]> = {
    small: ['btn-sm'],
    medium: ['btn-md'],
    large: ['btn-lg']
  };

  const variantClasses = variantClassesMap[variant] || variantClassesMap.primary;
  const sizeClasses = sizeClassesMap[size] || sizeClassesMap.medium;

  const classes = combineClasses(
    baseClasses,
    variantClasses,
    sizeClasses,
    className ? [className] : []
  );

  const handleClick = (event: any) => {
    if (disabled || loading) return;
    onClick?.(event);
  };

  // Simple button template return as string for now
  // This will be converted to proper JSX when React is properly set up
  const buttonHTML = `
    <button 
      type="${type}" 
      class="${classes}"
      ${disabled || loading ? 'disabled' : ''}
      data-loading="${loading}"
    >
      ${loading ? '<span class="spinner">⟳</span>' : ''}
      ${!loading && leftIcon ? '<span class="left-icon">' + leftIcon + '</span>' : ''}
      <span class="button-text">${children}</span>
      ${!loading && rightIcon ? '<span class="right-icon">' + rightIcon + '</span>' : ''}
    </button>
  `;

  return {
    type: 'button-component',
    html: buttonHTML,
    props: { onClick: handleClick, disabled: disabled || loading, ...props }
  };
};

export default Button;
