import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  FileCheck2,
  CalendarCheck,
  Plus,
  CreditCard,
  Building2,
  CheckCircle2
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import AttendancePieChart from '../../components/dashboard/AttendancePieChart';
import RecentActivity from '../../components/dashboard/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useNavigate } from 'react-router-dom';

export const CompanyAdminDashboard = () => {
  const navigate = useNavigate();

  const quickActionsList = [
    { label: 'Register Employee', icon: Users, onClick: () => navigate('/employees'), bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400', description: 'Add new staff member' },
    { label: 'Face Biometric', icon: UserCheck, onClick: () => navigate('/face-registration'), bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400', description: 'Enroll face vector' },
    { label: 'Generate QR Badges', icon: CreditCard, onClick: () => navigate('/card-attendance'), bgClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400', description: 'Print CR80 badges' },
    { label: 'Security Review', icon: ShieldAlert, onClick: () => navigate('/settings/security'), bgClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400', description: 'Review spoof alerts' }
  ];

  const pendingApprovals = [
    { id: '1', name: 'Aakash Verma', type: 'Sick Leave', days: '2 Days', date: '2026-09-26 to 2026-09-27', department: 'Engineering' },
    { id: '2', name: 'Neha Gupta', type: 'Casual Leave', days: '1 Day', date: '2026-09-28', department: 'Marketing' },
    { id: '3', name: 'Rohan Mehta', type: 'Overtime 2h', days: '2 Hours', date: '2026-09-25', department: 'Operations' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Company Admin Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric attendance overview, shift status, approvals, and security alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate('/attendance')} className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" />
            Live Punch Terminal
          </Button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Headcount"
          value="168"
          change="+4"
          changePeriod="new this month"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value="142"
          change="84.5%"
          changeType="increase"
          changePeriod="attendance rate"
          variant="emerald"
        />
        <StatsCard
          icon={Clock}
          label="Late Arrival"
          value="12"
          change="Grace active"
          changeType="neutral"
          variant="amber"
        />
        <StatsCard
          icon={UserX}
          label="Absent / Leave"
          value="14"
          change="8 on leave"
          changeType="decrease"
          variant="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Quick Management Actions
        </h3>
        <QuickActions actions={quickActionsList} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Weekly Attendance & Punctuality"
            subtitle="Present vs late percentage trends across all shifts"
          >
            <AttendanceTrendChart />
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Today's Headcount Ratio"
            subtitle="Live breakdown of 168 employees"
          >
            <AttendancePieChart />
          </ChartCard>
        </div>
      </div>

      {/* Bottom Grid: Approvals & Real-Time Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-500" />
              Pending Approvals ({pendingApprovals.length})
            </h3>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
              Review all
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{req.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {req.type} • {req.date} ({req.department})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="xs">Approve</Button>
                  <Button variant="outline" size="xs">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-Time Live Feed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Biometric & Security Feed
            </h3>
            <Badge variant="success" size="sm" dot>Live Stream</Badge>
          </div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;
