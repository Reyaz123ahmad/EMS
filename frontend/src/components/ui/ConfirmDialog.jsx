import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import Button from './Button';

export const ConfirmDialog = ({
  open,
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  isLoading = false
}) => {
  const isVisible = open !== undefined ? open : isOpen;
  if (!isVisible) return null;

  const icons = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle2
  };

  const IconComponent = icons[variant] || AlertTriangle;

  const variantColors = {
    danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/30',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/30',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/30',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/30'
  };

  const buttonVariants = {
    danger: 'danger',
    warning: 'warning',
    info: 'primary',
    success: 'success'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ${variantColors[variant] || variantColors.danger}`}>
            <IconComponent className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={buttonVariants[variant] || 'danger'}
            size="sm"
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
