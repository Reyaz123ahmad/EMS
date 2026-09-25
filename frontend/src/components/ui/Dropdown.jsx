import React, { useState, useRef, useEffect } from 'react';

export const Dropdown = ({
  trigger,
  children,
  align = 'right',
  width = 'w-56',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top'
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 ${width} ${alignClasses[align] || alignClasses.right} rounded-xl border border-slate-200/80 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-all duration-150 animate-in fade-in-0 zoom-in-95 ${className}`}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({
  icon: Icon,
  children,
  onClick,
  danger = false,
  disabled = false,
  badge = null,
  className = ''
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-50 text-slate-400 dark:text-slate-600'
          : danger
          ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon
            className={`w-4 h-4 ${
              danger
                ? 'text-rose-500'
                : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'
            }`}
          />
        )}
        <span>{children}</span>
      </div>
      {badge && <span>{badge}</span>}
    </button>
  );
};

export const DropdownDivider = () => (
  <div className="my-1.5 h-px bg-slate-100 dark:bg-slate-800" />
);

export default Dropdown;
