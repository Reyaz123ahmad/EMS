import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Square, AlertTriangle, Clock } from 'lucide-react';

export const BreakTimer = ({ activeBreak, onEndBreak, isEnding = false }) => {
  const timerRef = useRef(null);

  // Compute initial elapsed seconds strictly from server timestamp
  const calculateElapsed = () => {
    if (!activeBreak?.breakStartAt) return 0;
    const startTimestamp = new Date(activeBreak.breakStartAt).getTime();
    if (activeBreak.breakEndAt) {
      const endTimestamp = new Date(activeBreak.breakEndAt).getTime();
      return Math.max(0, Math.floor((endTimestamp - startTimestamp) / 1000));
    }
    return Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000));
  };

  const [elapsedSeconds, setElapsedSeconds] = useState(calculateElapsed);

  useEffect(() => {
    // If break has ended or no break active, clear interval immediately
    if (!activeBreak?.breakStartAt || activeBreak?.breakEndAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(calculateElapsed());
      return;
    }

    const startTimestamp = new Date(activeBreak.breakStartAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTimestamp) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();

    // Clear any previous interval before setting a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(updateTimer, 1000);

    // Sync timer on tab visibility change to eliminate background clock drift
    const handleVisibilityChange = () => {
      if (!document.hidden && !activeBreak.breakEndAt) {
        updateTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeBreak?.breakStartAt, activeBreak?.breakEndAt]);

  const handleEndClick = () => {
    if (isEnding) return;
    // Clear interval immediately on user click
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (onEndBreak) {
      onEndBreak();
    }
  };

  if (!activeBreak || activeBreak.breakEndAt) return null;

  const formatElapsedTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const expectedReturnTime = activeBreak.expectedReturnTime ? new Date(activeBreak.expectedReturnTime) : null;
  const isLate = expectedReturnTime ? Date.now() > expectedReturnTime.getTime() : false;
  const lateSeconds = isLate ? Math.floor((Date.now() - expectedReturnTime.getTime()) / 1000) : 0;
  const lateMinutes = Math.floor(lateSeconds / 60);

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 shadow-2xl backdrop-blur-md transition-all ${
      isLate
        ? 'border-rose-500/50 bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/20 shadow-rose-950/30'
        : 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 shadow-amber-950/30'
    }`}>
      {isLate && (
        <div className="mb-3.5 p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Late Return Warning: +{lateMinutes}m over allocated break time</span>
          </div>
          <span className="text-[11px] text-rose-400">Checkout time will be automatically extended</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border animate-pulse ${
            isLate ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            <Coffee className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLate ? 'text-rose-400' : 'text-amber-400'}`}>
                {activeBreak.breakType || 'SHORT'} Break Active
              </span>
              {expectedReturnTime && (
                <span className="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                  <Clock className="h-2.5 w-2.5 text-indigo-400" />
                  Expected Return: {expectedReturnTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <h4 className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              {formatElapsedTime(elapsedSeconds)}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEndClick}
          disabled={isEnding}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
            isLate
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
              : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/20'
          }`}
        >
          <Square className="h-4 w-4 fill-current" />
          {isEnding ? 'Ending Break...' : 'End Break & Resume Shift'}
        </button>
      </div>
    </div>
  );
};

export default BreakTimer;

