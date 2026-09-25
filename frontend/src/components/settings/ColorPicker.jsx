import React from 'react';

export function ColorPicker({ label, value, onChange, description }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value || '#4f46e5'}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="h-10 w-14 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value || '#4f46e5'}
          onChange={(e) => onChange && onChange(e.target.value)}
          className="w-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono uppercase text-slate-900 dark:text-white"
        />
      </div>
    </div>
  );
}

export default ColorPicker;
