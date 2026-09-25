import React from 'react';

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  status = null // 'online' | 'offline' | 'away' | 'busy' | null
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const statusSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5'
  };

  const statusColorClasses = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-400',
    away: 'bg-amber-500',
    busy: 'bg-rose-500'
  };

  const getInitials = (text) => {
    if (!text) return '?';
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              e.currentTarget.nextSibling.style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-semibold flex items-center justify-center shadow-sm select-none ${src ? 'hidden' : 'flex'}`}
      >
        {getInitials(name || alt)}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-slate-900 ${statusSizeClasses[size] || statusSizeClasses.md} ${statusColorClasses[status] || statusColorClasses.online}`}
        />
      )}
    </div>
  );
};

export default Avatar;
