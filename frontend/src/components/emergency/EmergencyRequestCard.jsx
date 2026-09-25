import React from 'react';
import { AlertCircle, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export function EmergencyRequestCard({ request, onApprove, onReject }) {
  const isPending = request.status === 'PENDING';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {request.employee?.firstName} {request.employee?.lastName}
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                ({request.employee?.employeeCode})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {request.reason}
            </p>
          </div>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            request.status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : request.status === 'REJECTED'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
          }`}
        >
          {request.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(request.date).toLocaleDateString()}
          </span>
          {request.checkInTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              In: {new Date(request.checkInTime).toLocaleTimeString()}
            </span>
          )}
        </div>

        {isPending && (onApprove || onReject) && (
          <div className="flex items-center gap-2">
            {onReject && (
              <button
                onClick={() => onReject(request)}
                className="px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                Reject
              </button>
            )}
            {onApprove && (
              <button
                onClick={() => onApprove(request)}
                className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Approve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmergencyRequestCard;
