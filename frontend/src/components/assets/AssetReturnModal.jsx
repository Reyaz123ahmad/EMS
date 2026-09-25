import React, { useState } from 'react';
import { X, RotateCcw } from 'lucide-react';

export function AssetReturnModal({ asset, isOpen, onClose, onReturn, isReturning }) {
  const [condition, setCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onReturn(asset.id, {
      condition,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-emerald-600" />
            Process Return: {asset.name}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Condition on Return
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold"
            >
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good (Normal Wear)</option>
              <option value="FAIR">Fair</option>
              <option value="DAMAGED">Damaged / Needs Repair</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Return Inspection Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Physical condition remarks, returned parts..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isReturning}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isReturning ? 'Processing...' : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetReturnModal;
