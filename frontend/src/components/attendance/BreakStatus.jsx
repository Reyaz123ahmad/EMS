import React, { useState } from 'react';
import { FiCoffee, FiAlertCircle, FiCheckCircle, FiLock } from 'react-icons/fi';
import { useBreakRules } from '../../hooks/useBreakRules.js';

export function BreakStatus({ employeeId, onStartBreak, isStartingBreak = false }) {
  const {
    canTakeBreak,
    totalBreaks,
    remainingBreaks,
    totalBreakMinutes,
    remainingMinutes,
    maxBreaks,
    maxBreakMinutes,
    lunchDurationMinutes,
    shortDurationMinutes,
    hasActiveBreak,
    reason,
    isLoading
  } = useBreakRules(employeeId);

  const [selectedType, setSelectedType] = useState('SHORT');

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-slate-700 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FiCoffee className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Daily Break Allowance</span>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            hasActiveBreak
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : canTakeBreak
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {hasActiveBreak ? (
            'Break In Progress'
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
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
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

      {/* Break Type Selector */}
      {!hasActiveBreak && (
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-medium block mb-1.5">Select Break Type:</label>
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
              Short Break ({shortDurationMinutes}m)
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
              Lunch Break ({lunchDurationMinutes}m)
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      {onStartBreak && !hasActiveBreak && (
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
              ? `Start ${selectedType === 'LUNCH' ? 'Lunch' : 'Short'} Break`
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
