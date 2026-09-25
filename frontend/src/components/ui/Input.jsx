import React from 'react';
import { cn } from '../../lib/utils.js';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, icon: Icon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'block w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 transition-colors duration-200',
              'focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50',
              Icon ? 'pl-10' : '',
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
