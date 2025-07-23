interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: any;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

/**
 * Modal component with overlay and customizable content
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    fullscreen: 'max-w-full w-full h-full'
  };

  const modalClass = `modal ${sizeClasses[size] || sizeClasses.medium} ${className || ''}`;

  const handleOverlayClick = (event: any) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  // Add escape key listener when modal opens
  if (isOpen && typeof document !== 'undefined') {
    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';
  }

  const cleanup = () => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    }
  };

  // Modal template
  const modalHTML = `
    <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="${modalClass} bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all">
        ${title || showCloseButton ? `
          <div class="modal-header flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            ${title ? `<h3 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h3>` : '<div></div>'}
            ${showCloseButton ? `
              <button class="modal-close-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        ` : ''}
        <div class="modal-content p-6">
          ${typeof children === 'string' ? children : ''}
        </div>
      </div>
    </div>
  `;

  return {
    type: 'modal-component',
    html: modalHTML,
    props: {
      onClose,
      onOverlayClick: handleOverlayClick,
      cleanup,
      isOpen
    }
  };
};

export default Modal;
