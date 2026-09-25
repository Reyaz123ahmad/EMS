import React from 'react';

export const QuickActions = ({
  actions = []
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            type="button"
            onClick={action.onClick}
            className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-indigo-500 hover:shadow-md dark:hover:border-indigo-500/50 transition-all duration-200 text-center"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 shadow-sm ${
              action.bgClass || 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
            }`}>
              {Icon && <Icon className="w-5 h-5" />}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {action.label}
            </span>
            {action.description && (
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {action.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
