import React from 'react';
import { cn } from '../../lib/utils.js';

export const Input = React.forwardRef(
  ({ className, type = 'text', label, error, icon: Icon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="w-full space-y-1 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#374151] dark:text-[#d1d5db]">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#9ca3af]">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'block w-full h-9 rounded-md border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] px-3 py-1.5 text-[13px] text-[#111827] dark:text-[#fafafa] placeholder-[#9ca3af] transition-colors',
              'focus:border-[#3b82f6] focus:bg-white dark:focus:bg-[#171717] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              Icon ? 'pl-8' : '',
              error ? 'border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]' : '',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[11px] text-[#ef4444] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
