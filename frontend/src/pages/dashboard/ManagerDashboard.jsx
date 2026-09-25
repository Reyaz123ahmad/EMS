import React from 'react';
import {
  Users,
  UserCheck,
  CheckSquare,
  FileCheck2,
  Clock,
  Briefcase
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const ManagerDashboard = () => {
  const pendingTasks = [
    { title: 'Sprint 14 Biometric API QA Review', assignee: 'Rahul S.', priority: 'HIGH', due: 'Today' },
    { title: 'Deploy Attendance Webhook Worker', assignee: 'Amit R.', priority: 'MEDIUM', due: 'Tomorrow' },
    { title: 'Generate Monthly Roster for Shifts', assignee: 'Pooja V.', priority: 'LOW', due: 'In 3 days' }
  ];

  const teamAttendance = [
    { name: 'Rahul Sharma', code: 'EMP001', status: 'PRESENT', inTime: '09:05 AM', worked: '6h 45m' },
    { name: 'Pooja Verma', code: 'EMP002', status: 'PRESENT', inTime: '09:12 AM', worked: '6h 38m' },
    { name: 'Amit Roy', code: 'EMP003', status: 'LATE', inTime: '09:48 AM', worked: '6h 02m' },
    { name: 'Siddharth Sen', code: 'EMP004', status: 'ON_LEAVE', inTime: '-', worked: '-' }
  ];

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

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm">
            Assign Team Task
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Direct Reports"
          value="18"
          change="Engineering & Design"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value="16"
          change="88.8%"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={CheckSquare}
          label="Sprint Tasks Pending"
          value="7"
          change="3 due today"
          variant="amber"
        />
        <StatsCard
          icon={FileCheck2}
          label="Approvals Required"
          value="2"
          change="Leaves pending"
          variant="rose"
        />
      </div>

      {/* Charts & Team Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Team Weekly Attendance & Overtime"
            subtitle="Punctuality patterns for direct reports"
          >
            <AttendanceTrendChart />
          </ChartCard>
        </div>

        {/* Pending Team Tasks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Sprint Tasks</span>
            <Badge variant="primary" size="sm">3 Active</Badge>
          </h3>

          <div className="space-y-3">
            {pendingTasks.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span className="truncate max-w-[180px]">{t.title}</span>
                  <Badge variant={t.priority === 'HIGH' ? 'danger' : 'warning'} size="sm">{t.priority}</Badge>
                </div>
                <div className="flex items-center justify-between text-slate-500 mt-2 text-[11px]">
                  <span>Assignee: {t.assignee}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Due: {t.due}</span>
                </div>
              </div>
            ))}
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
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamAttendance.map((row) => (
                <tr key={row.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
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
                  <td className="py-3 text-right">
                    <Button variant="outline" size="xs">View Log</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
