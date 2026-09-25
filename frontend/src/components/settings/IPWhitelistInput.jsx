import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

export function IPWhitelistInput({ ips = [], onChange, label = 'IP Whitelist Rules', description }) {
  const [newIp, setNewIp] = useState('');

  const handleAdd = () => {
    if (!newIp.trim()) return;
    if (!ips.includes(newIp.trim())) {
      onChange([...ips, newIp.trim()]);
    }
    setNewIp('');
  };

  const handleRemove = (index) => {
    onChange(ips.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </label>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          placeholder="e.g. 192.168.1.0/24 or 10.0.0.1"
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add IP
        </button>
      </div>

      {ips.length > 0 && (
        <div className="space-y-2 pt-2">
          {ips.map((ip, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-mono"
            >
              <span className="text-slate-700 dark:text-slate-300">{ip}</span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IPWhitelistInput;
