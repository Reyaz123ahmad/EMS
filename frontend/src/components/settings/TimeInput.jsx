import React from 'react';

export function TimeInput({ label, value, onChange, description }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
      />
    </div>
  );
}

export default TimeInput;
