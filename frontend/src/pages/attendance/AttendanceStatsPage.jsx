import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Award,
  AlertTriangle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAttendanceStats } from '../../hooks/useAttendance';
import { StatCard } from '../../components/shared/StatCard';
import { AttendanceTrendChart } from '../../components/charts/AttendanceTrendChart';
import { AttendanceBarChart } from '../../components/charts/AttendanceBarChart';
import { AttendancePieChart } from '../../components/charts/AttendancePieChart';

export const AttendanceStatsPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const { data: statsResponse, isLoading, refetch } = useAttendanceStats({ date: selectedDate });

  const stats = statsResponse?.data || {
    totalEmployees: 0,
    presentCount: 0,
    lateCount: 0,
    halfDayCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    punctualityRate: 0,
    trend: [],
    departmentBreakdown: []
  };

  const pieData = [
    { name: 'Present', value: stats.presentCount || 0, color: '#10b981' },
    { name: 'Late', value: stats.lateCount || 0, color: '#f59e0b' },
    { name: 'Half Day', value: stats.halfDayCount || 0, color: '#6366f1' },
    { name: 'Absent', value: stats.absentCount || 0, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <BarChart3 className="h-4 w-4" />
            <span>Executive Analytics & Intelligence</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Attendance Analytics Dashboard
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time workforce punctuality, departmental attendance ratios, and absenteeism metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Attendance Rate"
          value={`${stats.attendanceRate || 0}%`}
          variant="emerald"
          subtitle="Overall workforce check-in ratio"
        />
        <StatCard
          icon={Award}
          label="Punctuality Score"
          value={`${stats.punctualityRate || 0}%`}
          variant="indigo"
          subtitle="Arrivals within grace period"
        />
        <StatCard
          icon={Users}
          label="Active Present"
          value={`${stats.presentCount || 0} / ${stats.totalEmployees || 0}`}
          variant="cyan"
          subtitle="Employees on active shift"
        />
        <StatCard
          icon={AlertTriangle}
          label="Late & Absences"
          value={`${(stats.lateCount || 0) + (stats.absentCount || 0)}`}
          isIncreasePositive={false}
          variant="amber"
          subtitle="Deviations from scheduled shifts"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            7-Day Attendance Trend Curve
          </h3>
          <div className="mt-4">
            <AttendanceTrendChart data={stats.trend || []} period="weekly" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
            Status Breakdown
          </h3>
          <div className="mt-4">
            <AttendancePieChart data={pieData} />
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
          Departmental Attendance Benchmarks
        </h3>
        <div className="mt-4">
          <AttendanceBarChart data={stats.departmentBreakdown || []} />
        </div>
      </div>
    </div>
  );
};
export default AttendanceStatsPage;
