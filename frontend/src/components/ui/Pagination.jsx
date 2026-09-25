import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = null,
  limit = null,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-xs ${className}`}>
      {totalItems !== null && limit !== null && (
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * limit + 1}</span> to{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {Math.min(currentPage * limit, totalItems)}
          </span>{' '}
          of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> results
        </p>
      )}

      <div className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={index} className="px-2 text-slate-400">
                ...
              </span>
            );
          }
          const isCurrent = page === currentPage;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
