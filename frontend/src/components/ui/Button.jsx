import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#3b82f6] disabled:opacity-50 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[#3b82f6] text-white hover:bg-[#2563eb] border border-transparent',
        secondary:
          'bg-white dark:bg-[#171717] text-[#111827] dark:text-[#fafafa] hover:bg-[#f9fafb] dark:hover:bg-[#262626] border border-[#e5e7eb] dark:border-[#262626]',
        danger:
          'bg-[#ef4444] text-white hover:bg-[#dc2626] border border-transparent',
        ghost:
          'bg-transparent text-[#6b7280] dark:text-[#a3a3a3] hover:text-[#111827] dark:hover:text-[#fafafa] hover:bg-[#f3f4f6] dark:hover:bg-[#262626]'
      },
      size: {
        sm: 'h-8 px-2.5 text-[13px] gap-1.5',
        md: 'h-9 px-3.5 text-[13px] gap-2',
        lg: 'h-10 px-4 text-sm gap-2'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, isLoading, loading, children, disabled, ...props }, ref) => {
    const isSubmitting = Boolean(isLoading || loading);
    return (
      <button
        ref={ref}
        disabled={isSubmitting || disabled}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={isSubmitting ? 'true' : undefined}
        {...props}
      >
        {isSubmitting && (
          <svg
            className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
