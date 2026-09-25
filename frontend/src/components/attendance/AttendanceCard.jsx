import React from 'react';
import { Clock, LogIn, LogOut, Coffee, Calendar, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const AttendanceCard = ({ attendance, breaks = [] }) => {
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return { label: 'Present', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'LATE':
        return { label: 'Late Arrival', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'HALF_DAY':
        return { label: 'Half Day', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'ON_LEAVE':
        return { label: 'On Leave', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      default:
        return { label: status || 'Not Checked In', bg: 'bg-slate-700/30 text-slate-400 border-slate-700' };
    }
  };

  const badge = getStatusBadge(attendance?.status);
  const totalBreakMinutes = breaks.reduce((acc, b) => acc + (b.totalBreakMinutes || 0), 0);
  const workedHours = attendance?.totalWorkedMinutes
    ? `${Math.floor(attendance.totalWorkedMinutes / 60)}h ${attendance.totalWorkedMinutes % 60}m`
    : attendance?.checkInAt && !attendance?.checkOutAt
    ? 'In Progress'
    : '0h 0m';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <span>Today's Biometric Log</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
        </div>

        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold ${badge.bg}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
          {badge.label}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Check In */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400">
            <LogIn className="h-4 w-4" />
            <span>Check In</span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-100 font-mono">
            {formatTime(attendance?.checkInAt)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {attendance?.lateMinutes > 0 ? (
              <span className="text-amber-400 font-medium">+{attendance.lateMinutes}m Late</span>
            ) : attendance?.checkInAt ? (
              <span className="text-emerald-400">On Time</span>
            ) : (
              'Pending'
            )}
          </div>
        </div>

        {/* Check Out */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center space-x-2 text-xs font-medium text-rose-400">
            <LogOut className="h-4 w-4" />
            <span>Check Out</span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-100 font-mono">
            {formatTime(attendance?.checkOutAt)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {attendance?.overtimeMinutes > 0 ? (
              <span className="text-indigo-400 font-medium">+{attendance.overtimeMinutes}m Overtime</span>
            ) : (
              attendance?.checkOutAt ? 'Completed' : 'Pending'
            )}
          </div>
        </div>

        {/* Total Worked */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center space-x-2 text-xs font-medium text-indigo-400">
            <Clock className="h-4 w-4" />
            <span>Work Time</span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-100 font-mono">
            {workedHours}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Net shift duration
          </div>
        </div>

        {/* Breaks */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center space-x-2 text-xs font-medium text-amber-400">
            <Coffee className="h-4 w-4" />
            <span>Break Duration</span>
          </div>
          <div className="mt-2 text-lg font-bold text-slate-100 font-mono">
            {totalBreakMinutes}m
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {breaks.length} session{breaks.length === 1 ? '' : 's'} recorded
          </div>
        </div>
      </div>

      {attendance?.verificationLayers && (
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
            Verified Layers:
          </span>
          {Object.entries(attendance.verificationLayers).map(([layer, verified]) => (
            <span
              key={layer}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                verified
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              {verified ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {layer.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
