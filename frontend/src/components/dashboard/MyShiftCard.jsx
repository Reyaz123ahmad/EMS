import React from 'react';
import { useMyShift } from '../../hooks/useShifts';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

function calculateHours(start, end, isNight = false) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(eh)) return null;
  let startMin = sh * 60 + (sm || 0);
  let endMin = eh * 60 + (em || 0);
  if (isNight || endMin <= startMin) endMin += 24 * 60;
  const hrs = (endMin - startMin) / 60;
  return Number.isInteger(hrs) ? hrs : Number(hrs.toFixed(1));
}

export function MyShiftCard() {
  const { data: myShiftData, isLoading } = useMyShift();
  const shift = myShiftData?.shift;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            My Shift
          </span>
        </div>

        <Link
          to="/my-shift"
          className="inline-flex items-center text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline gap-1"
        >
          Details <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {shift ? (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {shift.name}
            </h4>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
              {shift.startTime} - {shift.endTime}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Working: <span className="font-semibold text-slate-700 dark:text-slate-200">
                {calculateHours(shift.startTime, shift.endTime, shift.isNightShift) ?? shift.workingHours}h
              </span>
            </div>
            <div>
              Grace: <span className="font-semibold text-slate-700 dark:text-slate-200">{shift.graceMinutes} min</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 py-1">
          No shift assigned. Contact HR admin.
        </div>
      )}
    </div>
  );
}

export default MyShiftCard;
