import React from 'react';
import { RotateCw, Trash2, Eye } from 'lucide-react';

export function JobTable({ jobs = [], onRetry, onRemove, onInspect, isActioning }) {
  const getJobBadge = (state) => {
    switch (state) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'failed':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
      case 'active':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <th className="py-3 px-4 font-semibold">Job ID / Name</th>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold">Attempts</th>
            <th className="py-3 px-4 font-semibold">Created / Processed</th>
            <th className="py-3 px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400">
                No jobs in this queue state.
              </td>
            </tr>
          ) : (
            jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{job.name}</div>
                  <div className="font-mono text-[10px] text-slate-400">#{job.id}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getJobBadge(job.state)}`}>
                    {job.state}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                  {job.attemptsMade || 0}
                </td>
                <td className="py-3 px-4 text-slate-400">
                  {job.timestamp ? new Date(job.timestamp).toLocaleTimeString() : '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onInspect && onInspect(job)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Inspect Payload"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onRetry && (
                      <button
                        onClick={() => onRetry(job.id)}
                        disabled={isActioning}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Retry Job"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(job.id)}
                        disabled={isActioning}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default JobTable;
