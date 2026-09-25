import React from 'react';

export function MultiSelect({ label, options = [], selected = [], onChange, description }) {
  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const name = typeof opt === 'object' ? opt.label : opt;
          const isChecked = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggleOption(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isChecked
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MultiSelect;
