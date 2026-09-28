import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useMonthlySummary } from '../../hooks/useAttendance';
import { useEmployees } from '../../hooks/useEmployee';
import { StatCard } from '../../components/shared/StatCard';
import { AttendancePieChart } from '../../components/charts/AttendancePieChart';
import { AttendanceTrendChart } from '../../components/charts/AttendanceTrendChart';
import useAuthStore from '../../store/auth.store';

export const MonthlySummaryPage = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'EMPLOYEE';
  const isEmployee = role === 'EMPLOYEE';

  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const { data: employeesRes } = useEmployees({ limit: 100 }, { enabled: !isEmployee });
  const employees = employeesRes?.data?.employees || [];

  const { data: summaryResponse, isLoading, refetch } = useMonthlySummary({
    month: selectedMonth,
    year: selectedYear,
    employeeId: isEmployee ? undefined : (selectedEmployee || undefined),
  });

  const summary = summaryResponse?.data || {
    stats: {
      totalEmployees: 0,
      totalPresent: 0,
      totalLate: 0,
      totalHalfDay: 0,
      totalAbsent: 0,
      totalWorkedMinutes: 0,
      totalOvertimeMinutes: 0,
    },
    employeeSummaries: [],
  };

  const stats = summary.stats || {};
  const totalWorkedHours = Math.round((stats.totalWorkedMinutes || 0) / 60);
  const totalOvertimeHours = Math.round((stats.totalOvertimeMinutes || 0) / 60);

  const pieData = [
    { name: 'Present', value: stats.totalPresent || 0 },
    { name: 'Late', value: stats.totalLate || 0 },
    { name: 'Half Day', value: stats.totalHalfDay || 0 },
    { name: 'Absent', value: stats.totalAbsent || 0 },
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleExport = () => {
    toast.success(`Monthly report for ${dayjs(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')} exported`);
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Calendar className="h-4 w-4" />
            <span>{role === 'EMPLOYEE' ? 'Self-Service Rollup' : 'Monthly Rollup & Payroll Aggregation'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {role === 'EMPLOYEE' ? 'My Monthly Attendance Summary' : 'Monthly Attendance Summary'}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            {role === 'EMPLOYEE' 
              ? 'Aggregated personal shift times, overtime hours, and attendance breakdown'
              : 'Aggregated shift times, overtime hours, and attendance percentages'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isEmployee && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode})
                </option>
              ))}
            </select>
          )}

          {/* Month Selector */}
          <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-white font-mono">
              {dayjs(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Present Days"
          value={stats.totalPresent || 0}
          variant="emerald"
          subtitle="Total verified check-ins"
        />
        <StatCard
          icon={Clock}
          label="Total Hours"
          value={`${totalWorkedHours} hrs`}
          variant="indigo"
          subtitle="Net productive shift duration"
        />
        <StatCard
          icon={TrendingUp}
          label="Overtime Hours"
          value={`${totalOvertimeHours} hrs`}
          variant="cyan"
          subtitle="Approved post-shift extensions"
        />
        <StatCard
          icon={AlertTriangle}
          label="Late / Half-Days"
          value={`${(stats.totalLate || 0) + (stats.totalHalfDay || 0)}`}
          isIncreasePositive={false}
          variant="amber"
          subtitle="Exceptions requiring audit"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            Monthly Distribution Breakdown
          </h3>
          <div className="mt-4">
            <AttendancePieChart data={pieData} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            Daily Trend (Attendance Curve)
          </h3>
          <div className="mt-4">
            <AttendanceTrendChart period="monthly" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default MonthlySummaryPage;
