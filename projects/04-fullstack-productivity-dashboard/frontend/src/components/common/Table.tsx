interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  sortable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Table component for displaying tabular data
 */
const Table = ({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  sortable = true,
  sortBy,
  sortOrder = 'asc',
  onSort,
  striped = true,
  hoverable = true,
  bordered = false,
  compact = false,
  className
}: TableProps) => {
  const handleSort = (columnKey: string) => {
    if (!sortable || !onSort) return;
    
    const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newOrder);
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortable || sortBy !== columnKey) {
      return '<span class="text-gray-400">↕</span>';
    }
    return sortOrder === 'asc' 
      ? '<span class="text-primary-600">↑</span>'
      : '<span class="text-primary-600">↓</span>';
  };

  const renderCellValue = (column: TableColumn, row: any) => {
    const value = row[column.key];
    if (column.render) {
      return column.render(value, row);
    }
    return value?.toString() || '';
  };

  const tableClasses = [
    'table',
    'w-full',
    'text-sm',
    'text-left',
    'text-gray-500',
    'dark:text-gray-400',
    bordered ? 'border border-gray-200 dark:border-gray-700' : '',
    className || ''
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'text-xs',
    'text-gray-700',
    'uppercase',
    'bg-gray-50',
    'dark:bg-gray-700',
    'dark:text-gray-400',
    compact ? 'px-3 py-2' : 'px-6 py-3'
  ];

  const cellClasses = [
    'text-gray-900',
    'dark:text-white',
    bordered ? 'border-b border-gray-200 dark:border-gray-700' : '',
    compact ? 'px-3 py-2' : 'px-6 py-4'
  ];

  const rowClasses = [
    'bg-white',
    'dark:bg-gray-900',
    bordered ? 'border-b border-gray-200 dark:border-gray-700' : '',
    striped ? 'odd:bg-gray-50 odd:dark:bg-gray-800' : '',
    hoverable ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''
  ];

  const tableHTML = `
    <div class="table-container overflow-x-auto shadow-sm rounded-lg">
      <table class="${tableClasses}">
        <thead class="sticky top-0 z-10">
          <tr>
            ${columns.map(column => `
              <th 
                scope="col" 
                class="${headerClasses.join(' ')} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'} ${sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}"
                ${column.width ? `style="width: ${column.width}"` : ''}
                ${sortable && column.sortable !== false ? `data-sortable="${column.key}"` : ''}
              >
                <div class="flex items-center gap-1 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'}">
                  <span>${column.label}</span>
                  ${sortable && column.sortable !== false ? getSortIcon(column.key) : ''}
                </div>
              </th>
            `).join('')}
          </tr>
        </thead>
        
        <tbody>
          ${loading ? `
            <tr>
              <td colspan="${columns.length}" class="${cellClasses.join(' ')} text-center py-8">
                <div class="flex items-center justify-center gap-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ` : data.length === 0 ? `
            <tr>
              <td colspan="${columns.length}" class="${cellClasses.join(' ')} text-center py-8 text-gray-500 dark:text-gray-400">
                ${emptyMessage}
              </td>
            </tr>
          ` : data.map((row, index) => `
            <tr class="${rowClasses.join(' ')}" data-row-index="${index}">
              ${columns.map(column => `
                <td class="${cellClasses.join(' ')} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}">
                  ${renderCellValue(column, row)}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  return {
    type: 'table-component',
    html: tableHTML,
    props: {
      columns,
      data,
      loading,
      sortable,
      sortBy,
      sortOrder,
      onSort: handleSort,
      striped,
      hoverable,
      bordered,
      compact
    }
  };
};

export default Table;
