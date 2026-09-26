import React from 'react';
import {
  Users,
  UserCheck,
  CheckSquare,
  FileCheck2,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import MyShiftCard from '../../components/dashboard/MyShiftCard';

export const ManagerDashboard = () => {
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/manager');
      return response.data?.data || response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Manager Overview...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load manager metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const directReports = dashboardData?.directReports || 0;
  const presentToday = dashboardData?.presentToday || 0;
  const pendingTasks = dashboardData?.tasks || [];
  const pendingApprovals = dashboardData?.pendingApprovals || 0;
  const teamAttendance = dashboardData?.teamAttendance || [];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Manager Team Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor direct reports, approve team time-off requests, and track project tasks.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Direct Reports"
          value={String(directReports)}
          change="Team allocation"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value={String(presentToday)}
          change={directReports > 0 ? `${Math.round((presentToday / directReports) * 100)}%` : '0%'}
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={CheckSquare}
          label="Sprint Tasks Pending"
          value={String(pendingTasks.length)}
          change="In progress"
          variant="amber"
        />
        <StatsCard
          icon={FileCheck2}
          label="Approvals Required"
          value={String(pendingApprovals)}
          change="Leaves pending"
          variant="rose"
        />
      </div>

      {/* My Shift Overview */}
      <div className="max-w-md">
        <MyShiftCard />
      </div>

      {/* Charts & Team Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Team Weekly Attendance & Overtime"
            subtitle="Punctuality patterns for direct reports"
          >
            <AttendanceTrendChart data={dashboardData?.attendanceTrend || []} />
          </ChartCard>
        </div>

        {/* Pending Team Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Sprint Tasks</span>
            <Badge variant="primary" size="sm">{pendingTasks.length} Active</Badge>
          </h3>

          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active sprint tasks assigned.</div>
            ) : (
              pendingTasks.map((t, idx) => (
                <div key={t.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span className="truncate max-w-[180px]">{t.title || 'Task'}</span>
                    <Badge variant={t.priority === 'HIGH' ? 'danger' : 'warning'} size="sm">{t.priority || 'NORMAL'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 mt-2 text-[11px]">
                    <span>Status: {t.status || 'PENDING'}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Deadline'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Attendance Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          Team Member Live Status
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="pb-3">Employee</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Worked Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">No team attendance data available for today.</td>
                </tr>
              ) : (
                teamAttendance.map((row) => (
                  <tr key={row.id || row.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">
                      {row.name} <span className="text-slate-400 font-normal">({row.code})</span>
                    </td>
                    <td className="py-3">
                      <Badge variant={row.status === 'PRESENT' ? 'success' : row.status === 'LATE' ? 'warning' : 'danger'} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{row.inTime}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{row.worked}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
