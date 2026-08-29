import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal, ChevronLeft, ChevronRight, Check, Minus } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn, formatNumber } from '@/lib/utils';
import { Badge } from './Badge';

const Table = ({
  columns = [],
  data = [],
  keyField = 'id',
  searchable = true,
  searchColumns = [],
  filterable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  pageSizes = [10, 25, 50, 100],
  selectable = false,
  onSelectionChange,
  selectedRows,
  loading = false,
  emptyMessage = 'No data available',
  className,
  rowClassName,
  onRowClick,
  striped = false,
  hoverable = true,
  stickyHeader = true,
  actions,
  footer,
  showRowNumbers = false,
  rowActions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowsState, setSelectedRowsState] = useState(selectedRows ?? []);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [filterOpen, setFilterOpen] = useState(null);

  useEffect(() => {
    if (selectedRows !== undefined) {
      setSelectedRowsState(selectedRows);
    }
  }, [selectedRows]);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const cols = searchColumns.length > 0 ? searchColumns : columns.map(c => c.key);
      result = result.filter(row => 
        cols.some(col => {
          const value = row[col];
          return value?.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        result = result.filter(row => {
          const rowValue = row[key];
          if (Array.isArray(value)) {
            return value.includes(rowValue);
          }
          return rowValue?.toString().toLowerCase().includes(value.toString().toLowerCase());
        });
      }
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const comparison = aVal > bVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, searchColumns, columns]);

  const paginatedData = useMemo(() => {
    if (!paginated) return filteredData;
    const start = (currentPage - 1) * pageSizeState;
    return filteredData.slice(start, start + pageSizeState);
  }, [filteredData, paginated, currentPage, pageSizeState]);

  const totalPages = Math.ceil(filteredData.length / pageSizeState);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectRow = (row) => {
    const isSelected = selectedRowsState.some(r => r[keyField] === row[keyField]);
    const newSelected = isSelected
      ? selectedRowsState.filter(r => r[keyField] !== row[keyField])
      : [...selectedRowsState, row];
    setSelectedRowsState(newSelected);
    onSelectionChange?.(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRowsState.length === paginatedData.length) {
      setSelectedRowsState([]);
      onSelectionChange?.([]);
    } else {
      setSelectedRowsState(paginatedData);
      onSelectionChange?.(paginatedData);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size) => {
    setPageSizeState(size);
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={cn('w-full', className)}>
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-transparent rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
              />
            </div>
          )}
          {filterable && columns.some(c => c.filterable) && (
            <div className="flex items-center gap-2 flex-wrap">
              {columns.filter(c => c.filterable).map(col => (
                <div key={col.key} className="relative">
                  <button
                    onClick={() => setFilterOpen(filterOpen === col.key ? null : col.key)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                      'hover:bg-hover',
                      filters[col.key] ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-secondary border border-border'
                    )}
                  >
                    <Filter className="w-4 h-4 mr-1.5 inline" />
                    {col.header}
                  </button>
                  {filterOpen === col.key && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass rounded-xl shadow-lg border border-border py-2 z-50 animate-dropdown">
                      <input
                        type="text"
                        placeholder={`Filter ${col.header}...`}
                        value={filters[col.key] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                         className="w-full px-3 py-2 text-sm bg-input border border-border rounded-xl mx-2 mb-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        autoFocus
                      />
                      {col.filterOptions?.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 px-3 py-2 hover:bg-hover cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Array.isArray(filters[col.key]) && filters[col.key].includes(opt.value)}
                            onChange={(e) => {
                              const current = Array.isArray(filters[col.key]) ? [...filters[col.key]] : [];
                              const updated = e.target.checked 
                                ? [...current, opt.value] 
                                : current.filter(v => v !== opt.value);
                              setFilters(prev => ({ ...prev, [col.key]: updated }));
                            }}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="table-container overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full border-collapse">
          <thead className={cn('sticky top-0 z-10', stickyHeader && 'bg-table-header')}>
            <tr>
              {selectable && (
                <th className="px-6 py-4 w-12">
                  <label className="flex items-center justify-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRowsState.length === paginatedData.length && paginatedData.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                      aria-label="Select all rows"
                    />
                  </label>
                </th>
              )}
              {showRowNumbers && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">
                  #
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
                    column.className,
                    column.align && `text-${column.align}`
                  )}
                  style={{ width: column.width, minWidth: column.minWidth }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {sortable && column.sortable !== false && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="p-1 rounded-full hover:bg-primary/10 text-text-secondary hover:text-primary transition-colors"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {getSortIcon(column.key)}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(actions || rowActions) && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-32">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0) + ((actions || rowActions) ? 1 : 0)} className="py-12 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="loader" />
                    <span className="text-text-secondary">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0) + ((actions || rowActions) ? 1 : 0)} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-secondary">
                    <svg className="w-12 h-12 text-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-text-primary">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={row[keyField]}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    hoverable && 'hover:bg-hover',
                    striped && rowIndex % 2 === 1 && 'bg-background/50',
                    rowClassName,
                    typeof rowClassName === 'function' ? rowClassName(row) : '',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {selectable && (
                    <td className="px-6 py-4">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRowsState.some(r => r[keyField] === row[keyField])}
                          onChange={() => handleSelectRow(row)}
                          onClick={e => e.stopPropagation()}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                      </label>
                    </td>
                  )}
                  {showRowNumbers && (
                    <td className="px-6 py-4 text-text-secondary text-sm">
                      {(currentPage - 1) * pageSizeState + rowIndex + 1}
                    </td>
                  )}
                  {columns.map(column => {
                    const value = row[column.key];
                    let content;
                    
                    if (column.render) {
                      content = column.render(value, row, rowIndex);
                    } else if (column.type === 'badge') {
                      content = <Badge variant={value}>{value}</Badge>;
                    } else if (column.type === 'currency') {
                      content = <span className="font-mono tabular-nums">${formatNumber(value)}</span>;
                    } else if (column.type === 'date') {
                      content = <span>{new Date(value).toLocaleDateString()}</span>;
                    } else if (column.type === 'avatar') {
                      content = (
                        <div className="flex items-center gap-3">
                          <div className="avatar avatar-sm bg-primary/10 text-primary">
                            {value?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{value?.name}</p>
                            <p className="text-sm text-text-secondary">{value?.email}</p>
                          </div>
                        </div>
                      );
                    } else {
                      content = <span>{value ?? '-'}</span>;
                    }

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 text-sm text-text-primary',
                          column.className,
                          column.align && `text-${column.align}`
                        )}
                        style={{ width: column.width, minWidth: column.minWidth }}
                      >
                        {content}
                      </td>
                    );
                  })}
                  {(actions || rowActions) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rowActions?.map((action, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row);
                            }}
                            className={cn(
                              'p-2 rounded-full transition-colors',
                              action.variant === 'danger' ? 'text-danger hover:bg-danger/10' :
                              action.variant === 'primary' ? 'text-primary hover:bg-primary/10' :
                              'text-text-secondary hover:bg-hover'
                            )}
                            title={action.label}
                            aria-label={action.label}
                          >
                            {action.icon}
                          </button>
                        ))}
                        {actions && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.onClick(row);
                            }}
                            className="p-2 rounded-full text-text-secondary hover:bg-hover hover:text-text-primary transition-colors"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginated && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-transparent rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">
              Showing <span className="font-semibold">{((currentPage - 1) * pageSizeState) + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * pageSizeState, filteredData.length)}</span> of{' '}
              <span className="font-semibold">{filteredData.length}</span> results
            </span>
            <select
              value={pageSizeState}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-input focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {pageSizes.map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'w-10 h-10 rounded-xl font-medium transition-all',
                      currentPage === pageNum
                         ? 'bg-primary text-white shadow-md'
                        : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                    )}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {footer && (
        <div className="mt-4 p-4 bg-transparent rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Table;
export { Table };
