import React, { useState, useEffect } from 'react';
import { Coffee, Play, Square, Timer, AlertCircle } from 'lucide-react';

export const BreakTimer = ({ activeBreak, onEndBreak, isEnding = false }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeBreak?.breakStartAt) return;

    const startTimestamp = new Date(activeBreak.breakStartAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeBreak]);

  const formatElapsedTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  if (!activeBreak) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Break in Progress</span>
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                {activeBreak.breakType || 'TEA_BREAK'}
              </span>
            </div>
            <h4 className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {formatElapsedTime(elapsedSeconds)}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onEndBreak}
          disabled={isEnding}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Square className="h-4 w-4 fill-current" />
          {isEnding ? 'Ending Break...' : 'End Break & Resume Shift'}
        </button>
      </div>
    </div>
  );
};
