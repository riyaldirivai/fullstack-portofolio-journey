interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  size?: 'small' | 'medium' | 'large';
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Pagination component for navigating through pages
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  showInfo = true,
  showSizeChanger = false,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
  size = 'medium',
  maxVisiblePages = 5,
  className
}: PaginationProps) => {
  const sizeConfig: Record<string, { button: string; text: string }> = {
    small: {
      button: 'px-2 py-1 text-xs',
      text: 'text-xs'
    },
    medium: {
      button: 'px-3 py-2 text-sm',
      text: 'text-sm'
    },
    large: {
      button: 'px-4 py-3 text-base',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Calculate visible page numbers
  const getVisiblePages = (): number[] => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = ((currentPage - 1) * itemsPerPage) + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  const buttonBaseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'border',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:ring-offset-2',
    config.button
  ];

  const pageButtonClasses = [
    ...buttonBaseClasses,
    'border-gray-300',
    'dark:border-gray-600',
    'bg-white',
    'dark:bg-gray-800',
    'text-gray-500',
    'dark:text-gray-400',
    'hover:bg-gray-50',
    'dark:hover:bg-gray-700',
    'hover:text-gray-700',
    'dark:hover:text-gray-300'
  ];

  const activeButtonClasses = [
    ...buttonBaseClasses,
    'border-primary-500',
    'bg-primary-50',
    'dark:bg-primary-900',
    'text-primary-600',
    'dark:text-primary-400'
  ];

  const disabledButtonClasses = [
    ...buttonBaseClasses,
    'border-gray-200',
    'dark:border-gray-700',
    'bg-gray-100',
    'dark:bg-gray-800',
    'text-gray-400',
    'dark:text-gray-600',
    'cursor-not-allowed'
  ];

  const paginationHTML = `
    <div class="pagination-container flex items-center justify-between ${className || ''}">
      ${showInfo && totalItems ? `
        <div class="pagination-info">
          <p class="${config.text} text-gray-700 dark:text-gray-300">
            Showing <span class="font-medium">${startItem}</span> to <span class="font-medium">${endItem}</span> of <span class="font-medium">${totalItems}</span> results
          </p>
        </div>
      ` : '<div></div>'}
      
      <div class="pagination-controls flex items-center gap-2">
        ${showSizeChanger && onPageSizeChange ? `
          <div class="page-size-changer flex items-center gap-2 mr-4">
            <label class="${config.text} text-gray-700 dark:text-gray-300">Show:</label>
            <select 
              class="page-size-select ${config.button} border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              data-current-size="${itemsPerPage}"
            >
              ${pageSizeOptions.map(option => `
                <option value="${option}" ${option === itemsPerPage ? 'selected' : ''}>${option}</option>
              `).join('')}
            </select>
          </div>
        ` : ''}
        
        <nav class="pagination-nav">
          <ul class="flex items-center -space-x-px">
            <!-- Previous button -->
            <li>
              <button 
                class="pagination-prev rounded-l-md ${currentPage === 1 ? disabledButtonClasses.join(' ') : pageButtonClasses.join(' ')}"
                ${currentPage === 1 ? 'disabled' : ''}
                data-page="${currentPage - 1}"
              >
                <span class="sr-only">Previous</span>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </li>
            
            <!-- First page -->
            ${visiblePages[0] > 1 ? `
              <li>
                <button class="pagination-page ${pageButtonClasses.join(' ')}" data-page="1">1</button>
              </li>
              ${visiblePages[0] > 2 ? `
                <li>
                  <span class="pagination-ellipsis ${pageButtonClasses.join(' ')} cursor-default">...</span>
                </li>
              ` : ''}
            ` : ''}
            
            <!-- Visible pages -->
            ${visiblePages.map(page => `
              <li>
                <button 
                  class="pagination-page ${page === currentPage ? activeButtonClasses.join(' ') : pageButtonClasses.join(' ')}"
                  data-page="${page}"
                  ${page === currentPage ? 'aria-current="page"' : ''}
                >
                  ${page}
                </button>
              </li>
            `).join('')}
            
            <!-- Last page -->
            ${visiblePages[visiblePages.length - 1] < totalPages ? `
              ${visiblePages[visiblePages.length - 1] < totalPages - 1 ? `
                <li>
                  <span class="pagination-ellipsis ${pageButtonClasses.join(' ')} cursor-default">...</span>
                </li>
              ` : ''}
              <li>
                <button class="pagination-page ${pageButtonClasses.join(' ')}" data-page="${totalPages}">${totalPages}</button>
              </li>
            ` : ''}
            
            <!-- Next button -->
            <li>
              <button 
                class="pagination-next rounded-r-md ${currentPage === totalPages ? disabledButtonClasses.join(' ') : pageButtonClasses.join(' ')}"
                ${currentPage === totalPages ? 'disabled' : ''}
                data-page="${currentPage + 1}"
              >
                <span class="sr-only">Next</span>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `;

  return {
    type: 'pagination-component',
    html: paginationHTML,
    props: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      showInfo,
      showSizeChanger,
      pageSizeOptions,
      size,
      maxVisiblePages
    }
  };
};

export default Pagination;
