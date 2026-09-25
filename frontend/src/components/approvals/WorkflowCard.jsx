import React from 'react';
import { Layers, ArrowRight, CheckCircle, Edit2, Trash2 } from 'lucide-react';

export function WorkflowCard({ workflow, onEdit, onDelete, onClick }) {
  const levels = Array.isArray(workflow.levels)
    ? workflow.levels
    : typeof workflow.levels === 'string'
    ? JSON.parse(workflow.levels)
    : [];

  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {workflow.name}
            </h3>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {workflow.entityType}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => onEdit(workflow)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(workflow.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Levels Path Preview */}
      <div className="space-y-1.5 pt-2">
        <span className="text-xs font-semibold text-slate-400">Approval Steps ({levels.length}):</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {levels.map((lvl, idx) => (
            <React.Fragment key={idx}>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                L{lvl.level}: {lvl.role}
              </span>
              {idx < levels.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkflowCard;
