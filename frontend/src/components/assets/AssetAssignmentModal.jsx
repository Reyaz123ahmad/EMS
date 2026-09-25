import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export function AssetAssignmentModal({ asset, isOpen, onClose, onAssign, isAssigning, employees = [] }) {
  const [employeeId, setEmployeeId] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [remarks, setRemarks] = useState('');

  if (!isOpen || !asset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(asset.id, {
      employeeId,
      condition,
      remarks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Assign Asset: {asset.name}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Select Employee
            </label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter Employee UUID or Code"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Condition on Handover
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold"
            >
              <option value="NEW">Brand New</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Handover Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Accessories included, serial notes, etc."
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
              disabled={isAssigning}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssetAssignmentModal;
