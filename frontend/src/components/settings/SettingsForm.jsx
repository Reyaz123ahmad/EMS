import React from 'react';
import { Save, RotateCcw } from 'lucide-react';

export function SettingsForm({ onSubmit, onReset, isSaving, isResetting, children }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {children}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting || isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving || isResetting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}

export default SettingsForm;
