interface ToggleProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: any) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  labelPosition?: 'left' | 'right';
  className?: string;
  name?: string;
  id?: string;
}

/**
 * Toggle/Switch component for boolean settings
 */
const Toggle = ({
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
  labelPosition = 'right',
  className,
  name,
  id
}: ToggleProps) => {
  const toggleId = id || name || `toggle-${Date.now()}`;

  const sizeConfig: Record<string, { switch: string; thumb: string; label: string }> = {
    small: {
      switch: 'h-4 w-7',
      thumb: 'h-3 w-3 translate-x-0 peer-checked:translate-x-3',
      label: 'text-xs'
    },
    medium: {
      switch: 'h-5 w-9',
      thumb: 'h-4 w-4 translate-x-0 peer-checked:translate-x-4',
      label: 'text-sm'
    },
    large: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5 translate-x-0 peer-checked:translate-x-5',
      label: 'text-base'
    }
  };

  const variantConfig: Record<string, { bg: string; thumb: string }> = {
    default: {
      bg: 'peer-checked:bg-primary-600 peer-focus:ring-primary-500',
      thumb: 'bg-white'
    },
    success: {
      bg: 'peer-checked:bg-green-600 peer-focus:ring-green-500',
      thumb: 'bg-white'
    },
    warning: {
      bg: 'peer-checked:bg-yellow-600 peer-focus:ring-yellow-500',
      thumb: 'bg-white'
    },
    danger: {
      bg: 'peer-checked:bg-red-600 peer-focus:ring-red-500',
      thumb: 'bg-white'
    }
  };

  const config = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  const handleChange = (event: any) => {
    if (disabled) return;
    const isChecked = event.target.checked;
    onChange?.(isChecked, event);
  };

  const labelElement = label ? `
    <label for="${toggleId}" class="font-medium text-gray-700 dark:text-gray-300 ${config.label} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}">
      ${label}
      ${required ? '<span class="text-red-500">*</span>' : ''}
    </label>
  ` : '';

  const toggleHTML = `
    <div class="toggle-container ${className || ''}">
      <div class="flex items-center ${labelPosition === 'left' ? 'flex-row-reverse' : ''} gap-3">
        <div class="relative">
          <input
            type="checkbox"
            id="${toggleId}"
            name="${name || ''}"
            class="sr-only peer"
            ${checked !== undefined ? (checked ? 'checked' : '') : ''}
            ${defaultChecked ? 'checked' : ''}
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            data-error="${error || ''}"
          />
          
          <div class="relative ${config.switch} bg-gray-200 dark:bg-gray-600 rounded-full transition-colors duration-200 ease-in-out ${variantStyles.bg} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${error ? 'ring-2 ring-red-500' : 'peer-focus:ring-2 peer-focus:ring-offset-2'}">
            <div class="absolute top-0.5 left-0.5 ${variantStyles.thumb} rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${config.thumb}"></div>
          </div>
        </div>
        
        ${labelElement}
      </div>
      
      ${helperText && !error ? `
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          ${helperText}
        </p>
      ` : ''}
      
      ${error ? `
        <p class="mt-2 text-sm text-red-600 dark:text-red-400">
          ${error}
        </p>
      ` : ''}
    </div>
  `;

  return {
    type: 'toggle-component',
    html: toggleHTML,
    props: {
      checked,
      defaultChecked,
      onChange: handleChange,
      disabled,
      required,
      error,
      id: toggleId,
      name,
      size,
      variant,
      labelPosition
    }
  };
};

export default Toggle;
