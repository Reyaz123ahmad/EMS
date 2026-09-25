import React from 'react';
import { cn } from '../../lib/utils.js';
import { Spinner } from './Spinner.jsx';
import { Button } from './Button.jsx';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No records found.',
  pagination = null, // { page, limit, total, totalPages, onPageChange }
  className,
  onRowClick
}) {
  return (
    <div className={cn('w-full flex flex-col space-y-4', className)}>
      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          {/* Table Header */}
          <thead className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={cn(
                    'px-6 py-4 transition-colors',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Spinner size="lg" className="text-blue-500" />
                    <span className="text-sm font-medium text-slate-400 animate-pulse">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      className="w-10 h-10 text-slate-600 mb-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-sm font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'transition-colors duration-150',
                    onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : 'hover:bg-slate-800/30'
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={cn(
                        'px-6 py-4 text-slate-200',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.cellClassName
                      )}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(pagination.page * pagination.limit, pagination.total || pagination.page * pagination.limit)}
            </span>{' '}
            of <span className="font-semibold text-slate-200">{pagination.total}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>

            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-slate-200">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
