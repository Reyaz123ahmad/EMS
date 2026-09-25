import React from 'react';
import { Plus, Trash2, ArrowDown } from 'lucide-react';

export function WorkflowLevelEditor({ levels = [], onChange }) {
  const addLevel = () => {
    const nextLevelNum = levels.length + 1;
    onChange([
      ...levels,
      {
        level: nextLevelNum,
        role: 'MANAGER',
        name: `Level ${nextLevelNum} Approval`,
      },
    ]);
  };

  const removeLevel = (index) => {
    const filtered = levels.filter((_, i) => i !== index);
    const renumbered = filtered.map((lvl, idx) => ({
      ...lvl,
      level: idx + 1,
    }));
    onChange(renumbered);
  };

  const updateLevel = (index, field, value) => {
    const updated = levels.map((lvl, i) => (i === index ? { ...lvl, [field]: value } : lvl));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Tiered Approval Levels
        </label>
        <button
          type="button"
          onClick={addLevel}
          className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Add Level
        </button>
      </div>

      <div className="space-y-2">
        {levels.map((lvl, idx) => (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                L{lvl.level}
              </span>

              <input
                type="text"
                value={lvl.name || ''}
                onChange={(e) => updateLevel(idx, 'name', e.target.value)}
                placeholder="Stage Name"
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs"
              />

              <select
                value={lvl.role}
                onChange={(e) => updateLevel(idx, 'role', e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-xs font-semibold"
              >
                <option value="MANAGER">Manager</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="COMPANY_ADMIN">Company Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>

              {levels.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLevel(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {idx < levels.length - 1 && (
              <div className="flex justify-center">
                <ArrowDown className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default WorkflowLevelEditor;
