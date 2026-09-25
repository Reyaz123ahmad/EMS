import React from 'react';

export const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  minHeight = 'min-h-[300px]'
}) => {
  return (
    <div className={`flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-all duration-200 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      <div className={`w-full flex-1 ${minHeight}`}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
