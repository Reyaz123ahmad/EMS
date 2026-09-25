import React from 'react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  required,
  placeholder,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full bg-slate-900/60 border ${
          error ? 'border-rose-500' : 'border-slate-700'
        } rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-400 block">{error}</span>}
    </div>
  );
}

export { Select };
