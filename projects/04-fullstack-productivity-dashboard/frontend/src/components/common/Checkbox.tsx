interface CheckboxProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: any) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled';
  indeterminate?: boolean;
  className?: string;
  name?: string;
  id?: string;
  value?: string;
}

/**
 * Checkbox component with label and validation
 */
const Checkbox = ({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  required = false,
  error,
  helperText,
  size = 'medium',
  variant = 'default',
  indeterminate = false,
  className,
  name,
  id,
  value
}: CheckboxProps) => {
  const checkboxId = id || name || `checkbox-${Date.now()}`;

  const sizeClasses: Record<string, string> = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  const labelSizeClasses: Record<string, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const variantClasses: Record<string, string> = {
    default: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
    filled: 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
  };

  const baseClasses = [
    'rounded',
    'border',
    'transition-all',
    'duration-200',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:ring-offset-2',
    'text-primary-600',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'cursor-pointer'
  ];

  const checkboxClasses = [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    error ? 'border-red-500 focus:ring-red-500' : '',
    className || ''
  ].filter(Boolean).join(' ');

  const handleChange = (event: any) => {
    if (disabled) return;
    const isChecked = event.target.checked;
    onChange?.(isChecked, event);
  };

  const checkboxHTML = `
    <div class="checkbox-container">
      <div class="flex items-start">
        <div class="flex items-center h-5">
          <input
            type="checkbox"
            id="${checkboxId}"
            name="${name || ''}"
            value="${value || ''}"
            class="${checkboxClasses}"
            ${checked !== undefined ? (checked ? 'checked' : '') : ''}
            ${defaultChecked ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            ${indeterminate ? 'data-indeterminate="true"' : ''}
            data-error="${error || ''}"
          />
        </div>
        
        ${label ? `
          <div class="ml-3 text-sm">
            <label for="${checkboxId}" class="font-medium text-gray-700 dark:text-gray-300 ${labelSizeClasses[size]} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}">
              ${label}
              ${required ? '<span class="text-red-500">*</span>' : ''}
            </label>
            
            ${helperText && !error ? `
              <p class="text-gray-500 dark:text-gray-400 ${labelSizeClasses[size]} mt-1">
                ${helperText}
              </p>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      ${error ? `
        <p class="mt-2 text-sm text-red-600 dark:text-red-400 ${label ? 'ml-8' : ''}">
          ${error}
        </p>
      ` : ''}
    </div>
  `;

  return {
    type: 'checkbox-component',
    html: checkboxHTML,
    props: {
      checked,
      defaultChecked,
      onChange: handleChange,
      disabled,
      required,
      error,
      indeterminate,
      id: checkboxId,
      name,
      value
    }
  };
};

export default Checkbox;
