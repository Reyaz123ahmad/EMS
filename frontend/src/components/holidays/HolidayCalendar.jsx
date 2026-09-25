import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

export default function HolidayCalendar({ year, holidays = [], onYearChange, onSelectHoliday }) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Annual Public Holiday Schedule</h2>
          <p className="text-sm text-slate-400">Official company recognized public holidays for {year}</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onYearChange(year - 1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-bold text-white px-4">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((monthName, idx) => {
          const monthNum = idx + 1;
          const monthHolidays = holidays.filter((h) => {
            const hDate = new Date(h.date);
            return hDate.getMonth() + 1 === monthNum;
          });

          return (
            <div
              key={monthName}
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between"
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/80">
                <span className="font-bold text-sm text-indigo-400">{monthName}</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  {monthHolidays.length} {monthHolidays.length === 1 ? 'Day' : 'Days'}
                </span>
              </div>

              {monthHolidays.length === 0 ? (
                <p className="text-xs text-slate-600 italic py-4 text-center">No holidays</p>
              ) : (
                <div className="space-y-2">
                  {monthHolidays.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => onSelectHoliday && onSelectHoliday(h)}
                      className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold">{h.name}</span>
                        <span className="text-[10px] text-indigo-300 font-medium">
                          {new Date(h.date).toLocaleDateString('en-US', { day: 'numeric', weekday: 'short' })}
                        </span>
                      </div>
                      {h.isOptional && (
                        <span className="text-[9px] text-amber-400 font-semibold block mt-0.5">
                          Optional / Floating
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
