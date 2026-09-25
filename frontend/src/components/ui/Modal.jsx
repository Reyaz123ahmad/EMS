import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Modal({ isOpen, onClose, title, description, children, className }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all duration-200 animate-in zoom-in-95',
          className
        )}
      >
        <div className="flex items-start justify-between pb-3">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
            {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
