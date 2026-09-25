import React from 'react';

export function ToggleSwitch({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </label>
        {description && (
          <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
          checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default ToggleSwitch;
