import React from 'react';

export const Progress = ({
  value = 0,
  max = 100,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = false,
  label = '',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-600',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-500',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600',
    info: 'bg-gradient-to-r from-sky-400 to-blue-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${sizeClasses[size] || sizeClasses.md}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantClasses[variant] || variantClasses.primary}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Progress;
