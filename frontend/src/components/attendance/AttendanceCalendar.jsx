import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, Calendar as CalendarIcon, User } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

export default function AttendanceCalendar({ month, year, data = [], onMonthChange, onSelectDay }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (month === 1) {
      onMonthChange?.(12, year - 1);
    } else {
      onMonthChange?.(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange?.(1, year + 1);
    } else {
      onMonthChange?.(month + 1, year);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success" size="sm">Present</Badge>;
      case 'LATE':
        return <Badge variant="warning" size="sm">Late</Badge>;
      case 'HALF_DAY':
        return <Badge variant="secondary" size="sm">Half Day</Badge>;
      case 'ABSENT':
        return <Badge variant="danger" size="sm">Absent</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="info" size="sm">On Leave</Badge>;
      default:
        return <Badge size="sm">{status || 'N/A'}</Badge>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {monthNames[month - 1]} {year}
            </h3>
            <p className="text-xs text-slate-400">Monthly attendance heatmap and day-wise inspection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrev} className="p-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMonthChange?.(new Date().getMonth() + 1, new Date().getFullYear())}>
            Current Month
          </Button>
          <Button variant="secondary" size="sm" onClick={handleNext} className="p-2">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold uppercase text-slate-500 py-2">
            {d}
          </div>
        ))}

        {data.map((dayObj) => {
          const isSelected = selectedDate === dayObj.date;
          const hasLogs = dayObj.totalLogs > 0;
          const isLate = dayObj.summary?.late > 0;
          const isAbsent = dayObj.summary?.absent > 0;
          const isPresent = dayObj.summary?.present > 0;

          return (
            <div
              key={dayObj.date}
              onClick={() => {
                setSelectedDate(dayObj.date);
                onSelectDay?.(dayObj);
              }}
              className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30'
                  : hasLogs
                  ? 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-800/60'
                  : 'border-slate-800/40 bg-slate-950/40 text-slate-600 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                  {dayObj.day}
                </span>
                {hasLogs && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dayObj.totalLogs} logged
                  </span>
                )}
              </div>

              {hasLogs ? (
                <div className="space-y-1">
                  {isPresent && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {dayObj.summary.present} Present
                    </div>
                  )}
                  {isLate && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {dayObj.summary.late} Late
                    </div>
                  )}
                  {isAbsent && (
                    <div className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {dayObj.summary.absent} Absent
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-slate-600">No logs</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
