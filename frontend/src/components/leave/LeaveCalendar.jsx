import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

export default function LeaveCalendar({ month, year, leaves = [], onMonthChange, onYearChange, onSelectLeave }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  const renderDays = () => {
    const cells = [];
    const leavesArray = Array.isArray(leaves)
      ? leaves
      : (leaves?.leaves || leaves?.data?.data || leaves?.data || []);

    // Blank cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-900/20 border border-slate-800/40 rounded-lg opacity-40"></div>);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLeaves = leavesArray.filter((l) => {
        if (!l || !l.startDate || !l.endDate) return false;
        try {
          const start = new Date(l.startDate).toISOString().split('T')[0];
          const end = new Date(l.endDate).toISOString().split('T')[0];
          return dateStr >= start && dateStr <= end;
        } catch (e) {
          return false;
        }
      });

      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[100px] p-2 bg-slate-900/40 border ${
            isToday ? 'border-indigo-500 shadow-lg shadow-indigo-500/10' : 'border-slate-800'
          } rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>
              {day}
            </span>
            {dayLeaves.length > 0 && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                {dayLeaves.length} on leave
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[70px] pr-0.5 custom-scrollbar">
            {dayLeaves.slice(0, 3).map((l) => (
              <div
                key={l.id}
                onClick={() => onSelectLeave && onSelectLeave(l)}
                className="text-[11px] p-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 cursor-pointer hover:bg-amber-500/20 truncate"
                title={`${l.employee?.firstName || 'Employee'} - ${l.leaveType?.name || 'Leave'}`}
              >
                <span className="font-semibold">{l.employee ? `${l.employee.firstName[0]}. ${l.employee.lastName}` : 'Emp'}:</span>{' '}
                {l.leaveType?.name || 'Leave'}
              </div>
            ))}
            {dayLeaves.length > 3 && (
              <div className="text-[10px] text-slate-400 text-center">+{dayLeaves.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Leave Calendar</h2>
          <p className="text-sm text-slate-400">Team scheduled leaves and availability</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-semibold text-white px-3 min-w-[130px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-bold text-slate-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">{renderDays()}</div>
    </Card>
  );
}
