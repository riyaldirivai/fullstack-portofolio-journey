# Common Components Library

This directory contains reusable UI components that form the foundation of the Productivity Dashboard application.

## Overview

All components are built with TypeScript interfaces and template-based rendering, providing type safety and consistency across the application. Each component follows a standardized API pattern with clear interfaces and comprehensive feature sets.

## Components List

### 1. Button Component

**Purpose**: Interactive button element with multiple variants and states

**Features**:

- **Variants**: primary, secondary, success, warning, danger, ghost
- **Sizes**: small, medium, large, full-width
- **States**: normal, loading, disabled
- **Icons**: left and right icon support
- **Accessibility**: ARIA labels and keyboard navigation

**Interface**:

```typescript
interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'full';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}
```

**Usage Examples**:

```typescript
// Primary action button
Button({
  text: 'Save Changes',
  variant: 'primary',
  size: 'md',
  onClick: () => saveData()
});

// Loading state
Button({
  text: 'Processing...',
  variant: 'primary',
  loading: true,
  disabled: true
});

// With icons
Button({
  text: 'Add Goal',
  variant: 'success',
  leftIcon: 'plus',
  onClick: () => addNewGoal()
});
```

<Button variant="primary" size="medium" onClick={handleClick}>
  Click me
</Button>
```

### Modal
A modal dialog component with overlay and customizable content.

**Props:**
- `isOpen`: boolean - Controls modal visibility
- `onClose`: Function to close modal
- `title`: string - Modal title
- `size`: 'small' | 'medium' | 'large' | 'fullscreen'
- `showCloseButton`: boolean (default: true)
- `closeOnOverlayClick`: boolean (default: true)

**Usage:**
```typescript
import { Modal } from '@/components/common';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
  Modal content goes here
</Modal>
```

### Loading
Loading indicators with various animations and sizes.

**Props:**
- `type`: 'spinner' | 'dots' | 'pulse' | 'skeleton'
- `size`: 'small' | 'medium' | 'large'
- `text`: string - Loading text
- `fullscreen`: boolean - Covers entire screen

**Usage:**
```typescript
import { Loading } from '@/components/common';

<Loading type="spinner" size="medium" text="Loading..." />
```

### Input
Form input component with label, validation, and various styles.

**Props:**
- `type`: Standard HTML input types
- `label`: string - Input label
- `placeholder`: string
- `value` / `defaultValue`: Input value
- `onChange`: Change handler
- `error`: string - Error message
- `helperText`: string - Helper text
- `size`: 'small' | 'medium' | 'large'
- `variant`: 'default' | 'filled' | 'outlined'
- `leftIcon` / `rightIcon`: Icon elements
- `required`: boolean

**Usage:**
```typescript
import { Input } from '@/components/common';

<Input 
  label="Email"
  type="email" 
  placeholder="Enter your email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>
```

### Card
Card container component with header, content, and footer sections.

**Props:**
- `title`: string - Card title
- `subtitle`: string - Card subtitle
- `headerActions`: JSX element - Actions in header
- `footer`: JSX element - Card footer content
- `variant`: 'default' | 'outlined' | 'elevated' | 'filled'
- `size`: 'small' | 'medium' | 'large'
- `padding`: 'none' | 'small' | 'medium' | 'large'
- `hover`: boolean - Hover effects
- `clickable`: boolean - Makes card clickable
- `onClick`: Click handler

**Usage:**
```typescript
import { Card } from '@/components/common';

<Card title="Card Title" subtitle="Card subtitle" hover>
  Card content goes here
</Card>
```

### Alert
Alert/notification component for displaying messages.

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: string - Alert title
- `message`: string - Alert message (required)
- `dismissible`: boolean (default: true)
- `onDismiss`: Function called when dismissed
- `action`: Object with label and onClick for action button
- `autoClose`: boolean - Auto dismiss after delay
- `autoCloseDelay`: number - Delay in milliseconds (default: 5000)

**Usage:**
```typescript
import { Alert } from '@/components/common';

<Alert 
  type="success" 
  title="Success!" 
  message="Operation completed successfully"
  onDismiss={() => setShowAlert(false)}
/>
```

### Dropdown
Select/dropdown component with search and multi-select capabilities.

**Props:**
- `options`: Array of {value, label, disabled} objects
- `value` / `defaultValue`: Selected value(s)
- `placeholder`: string
- `label`: string - Dropdown label
- `onChange`: Change handler
- `error`: string - Error message
- `helperText`: string - Helper text
- `size`: 'small' | 'medium' | 'large'
- `variant`: 'default' | 'filled' | 'outlined'
- `searchable`: boolean - Enables search functionality
- `multiple`: boolean - Multi-select mode
- `required`: boolean

**Usage:**
```typescript
import { Dropdown } from '@/components/common';

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3', disabled: true }
];

<Dropdown 
  label="Select an option"
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  searchable
/>
```

## Styling

All components use Tailwind CSS classes and follow the design system defined in `styles/globals.css`. Components are designed to work with both light and dark themes.

## Component Structure

Each component returns an object with:
- `type`: Component identifier
- `html`: HTML string template
- `props`: Component properties and handlers

This structure allows for easy integration with different rendering systems while maintaining TypeScript type safety.

## Notes

These components are currently implemented as template-based components due to the development environment constraints. When React is properly set up, they can be converted to standard JSX components while maintaining the same API.
