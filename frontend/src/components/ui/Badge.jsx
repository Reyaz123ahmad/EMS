import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-[#eff6ff] text-[#2563eb] border-[#dbeafe] dark:bg-[#172554] dark:text-[#93c5fd] dark:border-[#1e3a8a]',
    secondary: 'bg-[#f5f3ff] text-[#7c3aed] border-[#ede9fe] dark:bg-[#2e1065] dark:text-[#c4b5fd] dark:border-[#4c1d95]',
    success: 'bg-[#ecfdf5] text-[#059669] border-[#d1fae5] dark:bg-[#064e3b] dark:text-[#6ee7b7] dark:border-[#065f46]',
    warning: 'bg-[#fffbeb] text-[#d97706] border-[#fef3c7] dark:bg-[#451a03] dark:text-[#fcd34d] dark:border-[#78350f]',
    danger: 'bg-[#fef2f2] text-[#dc2626] border-[#fee2e2] dark:bg-[#450a0a] dark:text-[#fca5a5] dark:border-[#7f1d1d]',
    info: 'bg-[#eff6ff] text-[#2563eb] border-[#dbeafe] dark:bg-[#172554] dark:text-[#93c5fd] dark:border-[#1e3a8a]',
    neutral: 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb] dark:bg-[#262626] dark:text-[#d1d5db] dark:border-[#404040]'
  };

  const dotColorClasses = {
    primary: 'bg-[#3b82f6]',
    secondary: 'bg-[#8b5cf6]',
    success: 'bg-[#10b981]',
    warning: 'bg-[#f59e0b]',
    danger: 'bg-[#ef4444]',
    info: 'bg-[#3b82f6]',
    neutral: 'bg-[#9ca3af]'
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    lg: 'text-xs px-2.5 py-1 gap-1.5 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center rounded border transition-colors ${variantClasses[variant] || variantClasses.neutral} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColorClasses[variant] || dotColorClasses.neutral}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
