import React from 'react';
import { Laptop, Tag, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export function AssetCard({ asset, onClick, onAssign, onReturn }) {
  const isAssigned = asset.assignments?.length > 0;
  const activeAssignment = isAssigned ? asset.assignments[0] : null;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{asset.name}</h3>
            <span className="font-mono text-xs text-slate-400">Code: {asset.code}</span>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isAssigned
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          }`}
        >
          {isAssigned ? 'Assigned' : 'Available'}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Category: {asset.category || 'General'}</span>
        <span>Condition: {asset.condition || 'GOOD'}</span>
      </div>

      {isAssigned && activeAssignment && (
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
            {activeAssignment.employee?.firstName} {activeAssignment.employee?.lastName}
          </span>
          <span className="text-slate-400">
            {new Date(activeAssignment.assignedAt).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
}

export default AssetCard;
