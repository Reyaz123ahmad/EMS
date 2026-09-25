import React from 'react';
import { useEmergencyStats } from '../../hooks/useEmergencyAttendance.js';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export function EmergencyStatsPage() {
  const { data: stats, isLoading } = useEmergencyStats();

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Emergency Attendance Statistics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-level overview of manual punches, exception rates, and approval volume.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Requests</span>
            <AlertCircle className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {stats?.totalRequests || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">
            {stats?.pendingRequests || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Approved</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {stats?.approvedRequests || 0}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rejected</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">
            {stats?.rejectedRequests || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmergencyStatsPage;
