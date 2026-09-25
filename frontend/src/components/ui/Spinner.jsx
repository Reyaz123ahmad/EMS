import React from 'react';
import { cn } from '../../lib/utils.js';

export function Spinner({ className, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div
      className={cn(
        'inline-block animate-spin rounded-full border-solid border-blue-500 border-t-transparent',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;
