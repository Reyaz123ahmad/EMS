import React from 'react';
import { AlertTriangle, Clock, User, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';

export default function AttendanceExceptionCard({ exception, onResolve }) {
  const emp = exception.employee || {};
  const formattedDate = new Date(exception.attendanceDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const checkInTime = exception.checkInAt ? new Date(exception.checkInAt).toLocaleTimeString() : 'Missing';
  const checkOutTime = exception.checkOutAt ? new Date(exception.checkOutAt).toLocaleTimeString() : 'Missing';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
            {emp.firstName ? emp.firstName[0] : 'E'}
          </div>
          <div>
            <h4 className="font-semibold text-white text-base">
              {emp.firstName} {emp.lastName}
            </h4>
            <p className="text-xs text-slate-400 font-mono">{emp.employeeCode} • {emp.department?.name || 'General'}</p>
          </div>
        </div>

        <Badge variant={exception.status === 'ABSENT' ? 'danger' : 'warning'}>
          {exception.status || 'EXCEPTION'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-500 block">Date</span>
          <span className="font-medium text-slate-200">{formattedDate}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Check In</span>
          <span className="font-medium text-slate-200">{checkInTime}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Check Out</span>
          <span className={`font-medium ${!exception.checkOutAt ? 'text-rose-400' : 'text-slate-200'}`}>
            {checkOutTime}
          </span>
        </div>
      </div>

      {exception.remarks && (
        <p className="text-xs text-slate-400 italic bg-slate-800/30 p-2.5 rounded-lg border border-slate-800">
          "{exception.remarks}"
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <Button variant="secondary" size="sm" onClick={() => onResolve?.(exception, 'REGULARIZE')}>
          Regularize Attendance
        </Button>
        <Button variant="primary" size="sm" onClick={() => onResolve?.(exception, 'NOTIFY')}>
          Send Alert
        </Button>
      </div>
    </div>
  );
}
