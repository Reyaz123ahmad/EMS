import React from 'react';
import { cn } from '../../lib/utils.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] p-4 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-4 py-3 -mx-4 -mt-4 mb-3 border-b border-[#e5e7eb] dark:border-[#262626] flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-sm font-semibold tracking-tight text-[#111827] dark:text-[#fafafa]', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-xs text-[#6b7280] dark:text-[#a3a3a3] mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('px-4 py-3 -mx-4 -mb-4 mt-3 flex items-center justify-end gap-2 border-t border-[#e5e7eb] dark:border-[#262626]', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
