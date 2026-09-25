import React from 'react';
import { Cpu, Pause, Play, Trash2, ArrowRight } from 'lucide-react';

export function QueueStatsCard({ queue, onPause, onResume, onClean, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{queue.name}</h3>
            <span
              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase mt-0.5 ${
                queue.isPaused
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              }`}
            >
              {queue.isPaused ? 'PAUSED' : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {queue.isPaused ? (
            <button
              onClick={() => onResume && onResume(queue.name)}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Resume Queue"
            >
              <Play className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => onPause && onPause(queue.name)}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              title="Pause Queue"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onClean && onClean(queue.name)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Clean Queue"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Waiting</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{queue.waiting || 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Active</span>
          <span className="font-bold text-indigo-600">{queue.active || 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Done</span>
          <span className="font-bold text-emerald-600">{queue.completed || 0}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Failed</span>
          <span className="font-bold text-rose-600">{queue.failed || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default QueueStatsCard;
