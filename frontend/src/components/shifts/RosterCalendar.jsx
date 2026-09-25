import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function RosterCalendar({ month, year, rosters = [], onMonthChange, onYearChange }) {
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
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[90px] bg-slate-900/20 border border-slate-800/40 rounded-xl opacity-40"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRosters = rosters.filter((r) => {
        const rDate = new Date(r.date).toISOString().split('T')[0];
        return rDate === dateStr;
      });

      cells.push(
        <div
          key={`day-${day}`}
          className="min-h-[90px] p-2 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-300">{day}</span>
            {dayRosters.length > 0 && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                {dayRosters.length} Shifts
              </span>
            )}
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
            {dayRosters.slice(0, 2).map((r, idx) => (
              <div
                key={idx}
                className="text-[10px] p-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 truncate"
              >
                <span className="font-semibold">{r.employee?.firstName || 'Emp'}:</span>{' '}
                {r.shift?.name || 'Shift'}
              </div>
            ))}
            {dayRosters.length > 2 && (
              <div className="text-[9px] text-slate-400 text-center">+{dayRosters.length - 2} more</div>
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
          <h2 className="text-xl font-bold text-white">Roster Calendar View</h2>
          <p className="text-sm text-slate-400">Monthly shift allocations across all departments</p>
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
