import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X
} from 'lucide-react';

export const Alert = ({
  variant = 'info', // 'info' | 'success' | 'warning' | 'error'
  title,
  children,
  onClose,
  className = ''
}) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle
  };

  const IconComponent = icons[variant] || Info;

  const variantClasses = {
    info: 'bg-sky-50/80 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',
    error: 'bg-rose-50/80 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
  };

  const iconClasses = {
    info: 'text-sky-500 dark:text-sky-400',
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    error: 'text-rose-500 dark:text-rose-400'
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl border p-4 shadow-sm backdrop-blur-sm ${variantClasses[variant] || variantClasses.info} ${className}`}
    >
      <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconClasses[variant] || iconClasses.info}`} />
      
      <div className="flex-1 text-xs leading-relaxed">
        {title && <h5 className="font-semibold text-sm mb-0.5 tracking-tight">{title}</h5>}
        <div>{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
