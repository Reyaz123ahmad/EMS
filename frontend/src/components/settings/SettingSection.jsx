import React from 'react';

export function SettingSection({ title, description, children, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default SettingSection;
