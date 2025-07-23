// Re-export all types for easy importing
export * from './auth';
export * from './goals';
export * from './timer';
export * from './api';

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: any;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

export interface ErrorProps extends BaseComponentProps {
  error: string | Error;
  onRetry?: () => void;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
}

// Modal Types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  closeOnOverlayClick?: boolean;
  closeOnEscapeKey?: boolean;
}

// Chart Types
export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: ChartDataPoint[];
  options?: {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    legend?: {
      display: boolean;
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    scales?: {
      x?: {
        display: boolean;
        title?: { display: boolean; text: string };
      };
      y?: {
        display: boolean;
        title?: { display: boolean; text: string };
      };
    };
  };
}

// Table Types
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, item: T) => any;
}

export interface TableProps<T = any> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
}

// Layout Types
export interface LayoutProps extends BaseComponentProps {
  sidebar?: any;
  header?: any;
  footer?: any;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: any;
  path?: string;
  onClick?: () => void;
  children?: SidebarItem[];
  badge?: string | number;
  isActive?: boolean;
}

// Form Component Types
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  hint?: string;
  leftIcon?: any;
  rightIcon?: any;
}

export interface SelectProps extends BaseComponentProps {
  value?: string | number;
  onChange?: (value: string | number) => void;
  options: Array<{ label: string; value: string | number; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  multiple?: boolean;
  searchable?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'small' | 'medium' | 'large';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: any;
  rightIcon?: any;
  onClick?: (event: any) => void;
}
