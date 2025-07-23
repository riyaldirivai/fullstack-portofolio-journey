interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  label?: string;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  searchable?: boolean;
  multiple?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

/**
 * Dropdown/Select component with search and multi-select capabilities
 */
const Dropdown = ({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option...',
  label,
  onChange,
  disabled = false,
  required = false,
  error,
  helperText,
  size = 'medium',
  variant = 'default',
  searchable = false,
  multiple = false,
  className,
  name,
  id
}: DropdownProps) => {
  const dropdownId = id || name || `dropdown-${Date.now()}`;

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
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:border-primary-500',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'appearance-none',
    'cursor-pointer'
  ];

  const selectClasses = [
    ...baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
    'pr-10', // Space for dropdown arrow
    className || ''
  ].filter(Boolean).join(' ');

  const getSelectedOption = () => {
    const currentValue = value !== undefined ? value : defaultValue;
    return options.find(option => option.value === currentValue);
  };

  const selectedOption = getSelectedOption();

  const dropdownHTML = `
    <div class="dropdown-container w-full">
      ${label ? `
        <label for="${dropdownId}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          ${label}
          ${required ? '<span class="text-red-500">*</span>' : ''}
        </label>
      ` : ''}
      
      <div class="relative">
        ${searchable ? `
          <!-- Searchable dropdown will be more complex, for now showing basic select -->
          <div class="dropdown-search-container relative">
            <input
              type="text"
              id="${dropdownId}"
              name="${name || ''}"
              class="${selectClasses}"
              placeholder="${selectedOption ? selectedOption.label : placeholder}"
              ${disabled ? 'disabled' : ''}
              ${required ? 'required' : ''}
              data-searchable="true"
              data-value="${value || defaultValue || ''}"
            />
            <div class="dropdown-options hidden absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
              ${options.map(option => `
                <div 
                  class="dropdown-option px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}"
                  data-value="${option.value}"
                  ${option.disabled ? 'data-disabled="true"' : ''}
                >
                  ${option.label}
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <!-- Regular select dropdown -->
          <select
            id="${dropdownId}"
            name="${name || ''}"
            class="${selectClasses}"
            ${disabled ? 'disabled' : ''}
            ${required ? 'required' : ''}
            ${multiple ? 'multiple' : ''}
            data-value="${value || defaultValue || ''}"
          >
            ${!multiple && placeholder ? `<option value="" disabled ${!value && !defaultValue ? 'selected' : ''}>${placeholder}</option>` : ''}
            ${options.map(option => `
              <option 
                value="${option.value}"
                ${option.disabled ? 'disabled' : ''}
                ${(value !== undefined ? value === option.value : defaultValue === option.value) ? 'selected' : ''}
              >
                ${option.label}
              </option>
            `).join('')}
          </select>
        `}
        
        <!-- Dropdown arrow -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
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
    type: 'dropdown-component',
    html: dropdownHTML,
    props: {
      options,
      value,
      defaultValue,
      onChange,
      disabled,
      required,
      error,
      searchable,
      multiple,
      id: dropdownId
    }
  };
};

export default Dropdown;
