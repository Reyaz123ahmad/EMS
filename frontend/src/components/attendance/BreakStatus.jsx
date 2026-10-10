import React, { useState, useEffect } from 'react';
import { FiCoffee, FiAlertCircle, FiCheckCircle, FiLock, FiSlash, FiClock, FiCheckSquare } from 'react-icons/fi';
import { useBreakStatus } from '../../hooks/useAttendance.js';

function ActiveBreakItem({ activeBreak, onEndBreak, isEnding = false }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const updateElapsed = () => {
      const start = new Date(activeBreak.breakStartAt).getTime();
      const diffMs = Math.max(0, Date.now() - start);
      const diffSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      setElapsed(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeBreak.breakStartAt]);

  const typeLabel = activeBreak.breakType === 'LUNCH' ? 'Lunch Break' : 'Short Break';

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <div className="flex items-center space-x-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
        </span>
        <div>
          <p className="text-xs font-bold text-amber-300">
            {typeLabel}
          </p>
          <p className="text-[11px] font-mono text-amber-200/80 flex items-center gap-1">
            <FiClock className="w-3 h-3" /> {elapsed}
          </p>
        </div>
      </div>
      {onEndBreak && (
        <button
          type="button"
          onClick={() => onEndBreak(activeBreak.id, activeBreak.breakType)}
          disabled={isEnding}
          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
        >
          End Break
        </button>
      )}
    </div>
  );
}

export function BreakStatus({
  employeeId,
  onStartBreak,
  onEndBreak,
  onEndAllBreaks,
  isStartingBreak = false,
  isEndingBreak = false
}) {
  const { data: statusData, isLoading } = useBreakStatus(employeeId ? { employeeId } : {});

  const breakData = statusData?.data || statusData || {};
  const {
    canTakeBreak = false,
    totalBreaks = 0,
    remainingBreaks = 0,
    totalBreakMinutes = 0,
    remainingMinutes = 0,
    maxBreaks = 0,
    maxBreakMinutes = 0,
    lunchDurationMinutes = 0,
    shortDurationMinutes = 0,
    hasActiveBreak = false,
    activeBreaks = [],
    reason = '',
    rules = []
  } = breakData;

  const [selectedType, setSelectedType] = useState('SHORT');

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-slate-700 rounded w-full"></div>
      </div>
    );
  }

  const hasConfiguredRules = maxBreaks > 0 || maxBreakMinutes > 0 || (rules && rules.length > 0);
  const activeList = activeBreaks.length > 0 ? activeBreaks : (breakData.activeBreak ? [breakData.activeBreak] : []);

  return (
    <div className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FiCoffee className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Daily Break Allowance</span>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            hasActiveBreak
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : !hasConfiguredRules
              ? 'bg-slate-800 text-slate-400 border border-slate-700/60'
              : canTakeBreak
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {hasActiveBreak ? (
            `${activeList.length} Break${activeList.length > 1 ? 's' : ''} Active`
          ) : !hasConfiguredRules ? (
            <>
              <FiSlash className="w-3.5 h-3.5" /> No Policy
            </>
          ) : canTakeBreak ? (
            <>
              <FiCheckCircle className="w-3.5 h-3.5" /> {remainingBreaks} Breaks Left
            </>
          ) : (
            <>
              <FiAlertCircle className="w-3.5 h-3.5" /> Limit Reached
            </>
          )}
        </span>
      </div>

      {/* Quota stats */}
      {hasConfiguredRules ? (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
            <p className="text-slate-400">Breaks Count</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              {totalBreaks} / {maxBreaks} Taken
            </p>
          </div>
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
            <p className="text-slate-400">Total Minutes</p>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              {totalBreakMinutes} / {maxBreakMinutes}m used
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 font-medium">
            No break policy assigned to your shift.
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Contact your administrator to bind break rules to your shift schedule.
          </p>
        </div>
      )}

      {/* Active Breaks List */}
      {activeList.length > 0 && (
        <div className="space-y-2 pt-1">
          <label className="text-xs text-amber-300/90 font-semibold block">
            Active Breaks ({activeList.length}):
          </label>
          <div className="space-y-2">
            {activeList.map((b) => (
              <ActiveBreakItem
                key={b.id}
                activeBreak={b}
                onEndBreak={onEndBreak}
                isEnding={isEndingBreak}
              />
            ))}
          </div>

          {activeList.length > 1 && onEndAllBreaks && (
            <button
              type="button"
              onClick={onEndAllBreaks}
              disabled={isEndingBreak}
              className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold bg-rose-700/80 hover:bg-rose-600 text-white border border-rose-600/50 shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <FiCheckSquare className="w-3.5 h-3.5" /> End All Active Breaks ({activeList.length})
            </button>
          )}
        </div>
      )}

      {/* Break Type Selector */}
      {hasConfiguredRules && (
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1.5">
            {hasActiveBreak ? 'Add Another Break (Combined / Concurrent):' : 'Select Break Type:'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedType('SHORT')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                selectedType === 'SHORT'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Short Break {shortDurationMinutes > 0 ? `(${shortDurationMinutes}m)` : ''}
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('LUNCH')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                selectedType === 'LUNCH'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              Lunch Break {lunchDurationMinutes > 0 ? `(${lunchDurationMinutes}m)` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      {onStartBreak && hasConfiguredRules && (
        <div>
          <button
            onClick={() => onStartBreak(selectedType)}
            disabled={!canTakeBreak || isStartingBreak}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              canTakeBreak
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            {!canTakeBreak && <FiLock className="w-4 h-4" />}
            {isStartingBreak
              ? 'Starting Break...'
              : canTakeBreak
              ? hasActiveBreak
                ? `Start Additional ${selectedType === 'LUNCH' ? 'Lunch' : 'Short'} Break`
                : `Start ${selectedType === 'LUNCH' ? 'Lunch' : 'Short'} Break`
              : 'Break Limit Reached'}
          </button>
          {!canTakeBreak && reason && (
            <p className="text-[11px] text-rose-400/90 text-center mt-2 leading-relaxed">
              {reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default BreakStatus;
