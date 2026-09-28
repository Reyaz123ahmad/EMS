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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog (12px radius, clean borders) */}
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-xl border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] p-5 transition-all duration-150 animate-in zoom-in-95',
          className
        )}
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#e5e7eb] dark:border-[#262626]">
          <div>
            {title && <h3 className="text-base font-semibold text-[#111827] dark:text-[#fafafa]">{title}</h3>}
            {description && <p className="text-xs text-[#6b7280] dark:text-[#a3a3a3] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[#6b7280] hover:bg-[#f3f4f6] dark:hover:bg-[#262626] hover:text-[#111827] dark:hover:text-[#fafafa] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
