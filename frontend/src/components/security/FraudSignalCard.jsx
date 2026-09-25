import React from 'react';
import { AlertTriangle, Clock, MapPin, Smartphone, UserX, ShieldAlert } from 'lucide-react';

export function FraudSignalCard({ signal, onReview }) {
  const isHighSeverity = signal.severity === 'HIGH' || signal.severity === 'CRITICAL';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isHighSeverity
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {signal.signalType || signal.type || 'Spoofing Detected'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isHighSeverity
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                }`}
              >
                {signal.severity || 'MEDIUM'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {signal.reason || signal.description || 'Discrepancy flagged during biometric punch'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onReview && onReview(signal)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition-colors"
        >
          Review
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        {signal.employee && (
          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
            <UserX className="h-3.5 w-3.5 text-slate-400" />
            {signal.employee.firstName} {signal.employee.lastName} ({signal.employee.employeeCode})
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {signal.createdAt ? new Date(signal.createdAt).toLocaleString() : 'Just now'}
        </span>
        {signal.ipAddress && (
          <span className="font-mono">IP: {signal.ipAddress}</span>
        )}
      </div>
    </div>
  );
}

export default FraudSignalCard;
