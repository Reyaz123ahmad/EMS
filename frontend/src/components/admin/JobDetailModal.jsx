import React from 'react';
import { X, Code } from 'lucide-react';

export function JobDetailModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Job Payload #{job.id} ({job.name})
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1 text-xs">
          {job.failedReason && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono">
              <strong>Failure:</strong> {job.failedReason}
            </div>
          )}

          <div>
            <span className="font-semibold text-slate-400 block mb-1">Payload Data:</span>
            <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </div>

          {job.returnvalue && (
            <div>
              <span className="font-semibold text-slate-400 block mb-1">Return Value:</span>
              <pre className="p-3 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
                {JSON.stringify(job.returnvalue, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetailModal;
