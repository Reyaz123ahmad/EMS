import React from 'react';

export function NumberInput({ label, value, onChange, min, max, step = 1, suffix, description, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <div className="relative flex items-center">
        <input
          type="number"
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
        />
        {suffix && (
          <span className="absolute right-3 text-xs font-medium text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default NumberInput;
