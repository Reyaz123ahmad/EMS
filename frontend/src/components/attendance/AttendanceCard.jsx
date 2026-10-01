import React from 'react';
import { Clock, LogIn, LogOut, Coffee, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, Tag } from 'lucide-react';

export const AttendanceCard = ({ attendance, breaks = [], holiday = null, shift = null }) => {
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HOLIDAY':
        return { label: 'Holiday', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'PRESENT':
        return { label: 'Present', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'LATE':
        return { label: 'Late Arrival', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'HALF_DAY':
        return { label: 'Half Day', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'ON_LEAVE':
        return { label: 'On Leave', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'WEEKLY_OFF':
        return { label: 'Weekly Off', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'ABSENT':
        return { label: 'Absent', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
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

  const isRoster = shift?.source === 'ROSTER' || shift?.isRosterOverride || attendance?.shiftSource === 'ROSTER' || attendance?.isRosterOverride;
  const validTill = shift?.validTill;
  const defaultShift = shift?.defaultShift;

  const calculateShiftHours = (start, end, isNight = false) => {
    if (!start || !end) return null;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    if (isNaN(sH) || isNaN(eH)) return null;
    let sMin = sH * 60 + (sM || 0);
    let eMin = eH * 60 + (eM || 0);
    if (isNight || eMin <= sMin) eMin += 1440;
    return Number(((eMin - sMin) / 60).toFixed(1));
  };

  const assignedShift = shift?.currentShift || shift?.shift || (shift?.name ? shift : null) || (attendance?.shiftName ? {
    name: attendance.shiftName,
    startTime: attendance.shiftStartTime,
    endTime: attendance.shiftEndTime,
    graceMinutes: attendance.shiftGraceMinutes,
    isNightShift: attendance.isNightShift || false,
    workingHours: null
  } : null);

  const dynamicRequiredHours = shift?.requiredHours || assignedShift?.workingHours || (assignedShift?.startTime && assignedShift?.endTime ? calculateShiftHours(assignedShift.startTime, assignedShift.endTime, assignedShift.isNightShift) : null);
  const expectedCheckout = attendance?.checkInAt ? (attendance?.adjustedCheckOutTime || shift?.expectedCheckout || null) : null;
  const totalDelayMinutes = shift?.totalDelayMinutes ?? attendance?.totalDelayMinutes ?? ((attendance?.lateMinutes || 0) + (attendance?.extraBreakMinutes || 0));
  const lateMinutes = shift?.lateMinutes ?? attendance?.lateMinutes ?? 0;
  const extraBreakMinutes = shift?.extraBreakMinutes ?? attendance?.extraBreakMinutes ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-6 shadow-xl backdrop-blur-xl">
      {/* Holiday Banner */}
      {holiday?.isHoliday && (
        <div className="mb-5 p-3.5 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-purple-200">Public Holiday: {holiday.holiday?.name}</p>
              <p className="text-xs text-purple-300/80">Attendance is optional today. Relax and enjoy!</p>
            </div>
          </div>
          <span className="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2.5 py-1 rounded-full border border-purple-500/40">
            {holiday.holiday?.type || 'HOLIDAY'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <span>Today's Biometric Log</span>
          </div>
          <h3 className="mt-1 text-xl font-bold text-white">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h3>
          {assignedShift && (
            <div className="mt-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-indigo-400 flex items-center gap-1.5 font-semibold">
                  <Tag className="h-3.5 w-3.5" /> Shift: {assignedShift.name} ({assignedShift.startTime} - {assignedShift.endTime})
                  {assignedShift.graceMinutes !== undefined ? ` • Grace ${assignedShift.graceMinutes}m` : ''}
                </p>
                {isRoster && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                    ROSTER ACTIVE
                  </span>
                )}
              </div>
              {isRoster && validTill && (
                <p className="text-[11px] text-cyan-400/90 font-medium">
                  Live Status: On roster till {new Date(validTill).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {isRoster && defaultShift && (
                <p className="text-[11px] text-slate-500 line-through decoration-slate-600">
                  Default shift (deactivated during roster): {defaultShift.name} ({defaultShift.startTime} - {defaultShift.endTime})
                </p>
              )}
            </div>
          )}
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
            {attendance?.checkInAt ? (
              attendance?.checkOutAt ? (
                'Completed'
              ) : (
                <>
                  <div className="text-indigo-300">Expected: {formatTime(expectedCheckout)}</div>
                  {totalDelayMinutes > 0 && (
                    <div className="text-orange-500 text-xs">
                      +{totalDelayMinutes} min
                      {lateMinutes > 0 && ` (late ${lateMinutes})`}
                      {extraBreakMinutes > 0 && ` (extra break ${extraBreakMinutes})`}
                    </div>
                  )}
                </>
              )
            ) : (
              <div className="text-muted text-slate-400">Not checked in yet</div>
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
            Target: {dynamicRequiredHours}h
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

export default AttendanceCard;

