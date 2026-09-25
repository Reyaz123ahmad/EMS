import React from 'react';
import { cn } from '../../lib/utils.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-md transition-all',
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
    <div className={cn('mb-4 space-y-1', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold tracking-tight text-slate-100', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm text-slate-400', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
