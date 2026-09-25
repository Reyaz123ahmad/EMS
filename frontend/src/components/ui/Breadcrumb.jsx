import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items = [], showHome = true, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      {showHome && (
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Home</span>
          </Link>
          {items.length > 0 && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />}
        </div>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center">
            {isLast || !item.to ? (
              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-xs"
              >
                {item.label}
              </Link>
            )}
            {!isLast && <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
