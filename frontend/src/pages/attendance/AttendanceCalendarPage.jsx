import React, { useState } from 'react';
import AttendanceCalendar from '../../components/attendance/AttendanceCalendar.jsx';
import { useAttendanceCalendar } from '../../hooks/useAttendance.js';
import { useEmployees } from '../../hooks/useEmployee.js';
import useAuthStore from '../../store/auth.store.js';
import Header from '../../components/layout/Header.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Calendar as CalendarIcon, Filter, Users } from 'lucide-react';

export default function AttendanceCalendarPage() {
  const { user } = useAuthStore();
  const role = user?.role || 'EMPLOYEE';
  const isEmployee = role === 'EMPLOYEE';

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  const { data: calendarData, isLoading } = useAttendanceCalendar({
    month: currentMonth,
    year: currentYear,
    employeeId: isEmployee ? undefined : (selectedEmployee || undefined)
  });

  const { data: employeesRes } = useEmployees({ limit: 100 }, { enabled: !isEmployee });
  const employees = employeesRes?.data?.employees || [];

  const handleMonthChange = (m, y) => {
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            {isEmployee ? 'My Attendance Calendar' : 'Attendance Calendar'}
          </h1>
          <p className="text-sm text-slate-400">
            {isEmployee
              ? 'Day-by-day personal attendance heatmap and records'
              : 'Day-by-day attendance heatmaps and individual records'}
          </p>
        </div>

        {!isEmployee && (
          <div className="flex items-center gap-3">
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AttendanceCalendar
              month={currentMonth}
              year={currentYear}
              data={calendarData?.data?.days || []}
              onMonthChange={handleMonthChange}
              onSelectDay={(day) => setSelectedDayDetails(day)}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              Day Inspection
            </h3>

            {selectedDayDetails ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400">Inspected Date</span>
                  <p className="text-lg font-bold text-white">{selectedDayDetails.date}</p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 font-semibold text-center">
                      {selectedDayDetails.summary?.present || 0} Present
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 font-semibold text-center">
                      {selectedDayDetails.summary?.late || 0} Late
                    </div>
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 font-semibold text-center">
                      {selectedDayDetails.summary?.absent || 0} Absent
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  <h4 className="text-xs font-bold uppercase text-slate-400">Punch Logs ({selectedDayDetails.logs?.length || 0})</h4>
                  {selectedDayDetails.logs?.length > 0 ? (
                    selectedDayDetails.logs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-white">{log.employee?.firstName} {log.employee?.lastName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{log.employee?.employeeCode}</p>
                        </div>
                        <Badge variant={log.status === 'PRESENT' ? 'success' : log.status === 'LATE' ? 'warning' : 'danger'}>
                          {log.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No activity recorded for this day.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Click any calendar day to inspect detailed logs and punches.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
