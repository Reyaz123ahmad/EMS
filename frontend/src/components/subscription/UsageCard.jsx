import React from 'react';

export function UsageCard({ title, current, max, icon: Icon, color = 'indigo' }) {
  const isUnlimited = max === -1 || max === null || max === undefined;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round(((current || 0) / max) * 100));

  const isNearLimit = !isUnlimited && percentage >= 85;

  const colorStyles = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    purple: 'bg-purple-600',
    amber: 'bg-amber-600',
  }[color] || 'bg-indigo-600';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">{current || 0}</span>
        <span className="text-sm text-slate-400">
          / {isUnlimited ? 'Unlimited' : max}
        </span>
      </div>

      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isNearLimit ? 'bg-rose-500' : colorStyles
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{percentage}% used</span>
            {isNearLimit && <span className="text-rose-500 font-semibold">Near Limit</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageCard;
