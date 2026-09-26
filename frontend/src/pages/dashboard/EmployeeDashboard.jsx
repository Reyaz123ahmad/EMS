import React from 'react';
import {
  Clock,
  CalendarCheck,
  Camera,
  CreditCard,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatsCard from '../../components/dashboard/StatsCard';
import QuickActions from '../../components/dashboard/QuickActions';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import useAuthStore from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MyShiftCard from '../../components/dashboard/MyShiftCard';

export const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['employeeDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/employee');
      return response.data?.data || response.data;
    }
  });

  const quickActions = [
    { label: 'Live Punch', icon: Clock, onClick: () => navigate('/attendance'), bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400', description: 'Attendance Terminal' },
    { label: 'Face Punch', icon: Camera, onClick: () => navigate('/face-registration'), bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400', description: 'Biometric verification' },
    { label: 'My QR Card', icon: CreditCard, onClick: () => navigate('/card-attendance'), bgClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400', description: 'View & scan badge' },
    { label: 'Apply Leave', icon: Calendar, onClick: () => navigate('/settings/leave'), bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400', description: 'Request time off' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Employee Workspace...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load workspace metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const isCheckedIn = dashboardData?.isCheckedIn || false;
  const checkInTime = dashboardData?.checkInTime ? new Date(dashboardData.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const checkOutTime = dashboardData?.checkOutTime ? new Date(dashboardData.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
  const workMinutesToday = dashboardData?.workMinutesToday || 0;
  const hoursWorked = `${Math.floor(workMinutesToday / 60)}h ${workMinutesToday % 60}m`;
  const monthlyAttendanceCount = dashboardData?.monthlyAttendanceCount || 0;
  const totalLeaveRemaining = dashboardData?.totalLeaveRemaining || 0;
  const leaveBalances = dashboardData?.leaveBalances || [];
  const upcomingHolidays = dashboardData?.upcomingHolidays || [];
  const recentPayslips = dashboardData?.recentPayslips || [];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Employee Self-Service Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {user?.name || user?.email?.split('@')[0] || 'Team Member'}! 👋
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm max-w-lg leading-relaxed">
              You are currently <span className="font-bold underline text-white">{isCheckedIn ? 'Checked In' : 'Checked Out'}</span> today.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isCheckedIn ? 'danger' : 'success'}
              size="md"
              onClick={() => navigate('/attendance')}
              className="shadow-lg shadow-black/20 font-bold"
            >
              {isCheckedIn ? 'View Terminal Punch' : 'Punch In Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          label="Today's Hours"
          value={hoursWorked}
          change={isCheckedIn ? 'Active shift' : 'Offline'}
          changeType="increase"
          variant="indigo"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Attendance (This Month)"
          value={`${monthlyAttendanceCount} Days`}
          change="Present logged"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Calendar}
          label="Leave Balance"
          value={`${totalLeaveRemaining} Days`}
          change="Available to apply"
          variant="sky"
        />
        <StatsCard
          icon={DollarSign}
          label="Salary Records"
          value={`${recentPayslips.length} Slips`}
          change="Disbursed"
          variant="violet"
        />
      </div>

      {/* My Shift & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div>
          <MyShiftCard />
        </div>
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Quick Employee Actions
          </h3>
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* Grid: Shift Progress & Leave Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shift & Worked Time */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Today's Shift Status</span>
            <Badge variant={isCheckedIn ? 'success' : 'neutral'} size="sm">
              {isCheckedIn ? 'On Duty' : 'Not Clocked In'}
            </Badge>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">Punch In</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{checkInTime}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">Punch Out</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{checkOutTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balances Summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Leave Quota
          </h3>

          <div className="space-y-3 text-xs">
            {leaveBalances.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No leave balance quotas assigned.</p>
            ) : (
              leaveBalances.map((b) => (
                <div key={b.id}>
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">{b.leaveType?.name || 'Leave'}</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{b.remaining || 0} / {b.total || 0} Remaining</span>
                  </div>
                  <Progress 
                    value={b.total > 0 ? Math.round(((b.remaining || 0) / b.total) * 100) : 0} 
                    max={100} 
                    variant="primary" 
                    size="sm" 
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Upcoming Holidays</span>
          </h3>

          <div className="space-y-2.5">
            {upcomingHolidays.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No upcoming holidays scheduled.</p>
            ) : (
              upcomingHolidays.map((h, i) => (
                <div key={h.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100">{h.name}</h5>
                    <p className="text-[11px] text-slate-400">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{h.type || 'Holiday'}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Payslips */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Salary Slips & Payroll Records
          </h3>
          <Button variant="outline" size="xs" onClick={() => navigate('/settings/payroll')}>
            View All Slips
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {recentPayslips.length === 0 ? (
            <div className="col-span-3 py-6 text-center text-xs text-slate-500">
              No salary slips issued yet.
            </div>
          ) : (
            recentPayslips.map((p, idx) => (
              <div key={p.id || idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.month || 'Payslip'}</span>
                  <Badge variant="success" size="sm">{p.status || 'PAID'}</Badge>
                </div>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{(Number(p.netSalary) || Number(p.amount) || 0).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Disbursed: {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
