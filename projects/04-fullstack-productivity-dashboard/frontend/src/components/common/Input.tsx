interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  label?: string;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: any) => void;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  leftIcon?: any;
  rightIcon?: any;
  className?: string;
  name?: string;
  id?: string;
  [key: string]: any;
}

/**
 * Input component with label, validation, and various styles
 */
const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  required = false,
  error,
  helperText,
  size = 'medium',
  variant = 'default',
  leftIcon,
  rightIcon,
  className,
  name,
  id,
  ...props
}: InputProps) => {
  const inputId = id || name || `input-${Date.now()}`;

  const sizeClasses: Record<string, string> = {
    small: 'px-3 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-5 py-3 text-base'
  };

  const variantClasses: Record<string, string> = {
    default: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
    filled: 'border-0 bg-gray-100 dark:bg-gray-700',
    outlined: 'border-2 border-primary-300 dark:border-primary-600 bg-transparent'
  };

  const baseClasses = [
    'w-full',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'text-gray-900',
    'dark:text-white',
    'placeholder-gray-500',
    'dark:placeholder-gray-400',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:border-primary-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed'
  ];

  const inputClasses = [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className || ''
  ].filter(Boolean).join(' ');

  const inputHTML = `
    <div class="form-group w-full">
      ${label ? `
        <label for="${inputId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ${label}
          ${required ? '<span class="text-red-500">*</span>' : ''}
        </label>
      ` : ''}
      
      <div class="relative">
        ${leftIcon ? `
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div class="h-5 w-5 text-gray-400">
              ${leftIcon}
            </div>
          </div>
        ` : ''}
        
        <input
          type="${type}"
          id="${inputId}"
          name="${name || ''}"
          class="${inputClasses}"
          placeholder="${placeholder || ''}"
          ${value !== undefined ? `value="${value}"` : ''}
          ${defaultValue !== undefined ? `value="${defaultValue}"` : ''}
          ${disabled ? 'disabled' : ''}
          ${required ? 'required' : ''}
          data-error="${error || ''}"
        />
        
        ${rightIcon ? `
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div class="h-5 w-5 text-gray-400">
              ${rightIcon}
            </div>
          </div>
        ` : ''}
      </div>
      
      ${error ? `
        <p class="mt-2 text-sm text-red-600 dark:text-red-400">
          ${error}
        </p>
      ` : helperText ? `
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          ${helperText}
        </p>
      ` : ''}
    </div>
  `;

  return {
    type: 'input-component',
    html: inputHTML,
    props: {
      onChange,
      onFocus,
      onBlur,
      value,
      disabled,
      required,
      error,
      id: inputId,
      ...props
    }
  };
};

export default Input;
