import React, { useState } from 'react';
import {
  Clock,
  CalendarCheck,
  Camera,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import QuickActions from '../../components/dashboard/QuickActions';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import useAuthStore from '../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(true);

  const handleQuickCheckIn = () => {
    setIsCheckedIn(!isCheckedIn);
    toast.success(isCheckedIn ? 'Checked Out successfully!' : 'Checked In successfully!', {
      description: `Time: ${new Date().toLocaleTimeString()}`
    });
  };

  const quickActions = [
    { label: isCheckedIn ? 'Quick Check-Out' : 'Quick Check-In', icon: Clock, onClick: handleQuickCheckIn, bgClass: isCheckedIn ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400', description: isCheckedIn ? 'End work day' : 'Start work day' },
    { label: 'Face Punch', icon: Camera, onClick: () => navigate('/face-registration'), bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400', description: 'Biometric verification' },
    { label: 'My QR Card', icon: CreditCard, onClick: () => navigate('/card-attendance'), bgClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400', description: 'View & scan badge' },
    { label: 'Apply Leave', icon: Calendar, onClick: () => navigate('/settings/leave'), bgClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400', description: 'Request time off' }
  ];

  const recentPayslips = [
    { month: 'August 2026', net: '₹84,500', status: 'PAID', date: '31 Aug 2026' },
    { month: 'July 2026', net: '₹84,500', status: 'PAID', date: '31 Jul 2026' },
    { month: 'June 2026', net: '₹82,000', status: 'PAID', date: '30 Jun 2026' }
  ];

  const upcomingHolidays = [
    { name: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', type: 'National' },
    { name: 'Dussehra', date: '20 Oct 2026', day: 'Tuesday', type: 'Festival' },
    { name: 'Diwali', date: '08 Nov 2026', day: 'Sunday', type: 'Festival' }
  ];

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
              You are currently <span className="font-bold underline text-white">{isCheckedIn ? 'Checked In' : 'Checked Out'}</span> today since 09:04 AM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isCheckedIn ? 'danger' : 'success'}
              size="md"
              onClick={handleQuickCheckIn}
              className="shadow-lg shadow-black/20 font-bold"
            >
              {isCheckedIn ? 'Check Out Now' : 'Check In Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          label="Today's Hours"
          value="6h 45m"
          change="Shift: 8h Required"
          changeType="increase"
          variant="indigo"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Attendance (This Month)"
          value="21 / 22 Days"
          change="95.4% Rate"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Calendar}
          label="Leave Balance"
          value="14 Days"
          change="8 Casual, 6 Sick"
          variant="sky"
        />
        <StatsCard
          icon={DollarSign}
          label="Latest Net Salary"
          value="₹84,500"
          change="Credited Aug 31"
          variant="violet"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
          Quick Employee Actions
        </h3>
        <QuickActions actions={quickActions} />
      </div>

      {/* Grid: Shift Progress & Leave Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Shift & Worked Time */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Today's Shift Progress</span>
            <Badge variant="success" size="sm">Standard Shift (9-5)</Badge>
          </h3>

          <div className="space-y-3 pt-2">
            <Progress value={84} max={100} label="Shift Completion" showLabel variant="primary" size="lg" />

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">Punch In</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">09:04 AM</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 text-[11px]">Est. Punch Out</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">05:04 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Balances Summary */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Leave Quota (2026)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Casual Leave</span>
                <span className="text-indigo-600 dark:text-indigo-400">8 / 12 Remaining</span>
              </div>
              <Progress value={66} max={100} variant="primary" size="sm" />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Sick Leave</span>
                <span className="text-emerald-600 dark:text-emerald-400">6 / 8 Remaining</span>
              </div>
              <Progress value={75} max={100} variant="success" size="sm" />
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Earned / Privilege Leave</span>
                <span className="text-amber-600 dark:text-amber-400">10 / 15 Remaining</span>
              </div>
              <Progress value={66} max={100} variant="warning" size="sm" />
            </div>
          </div>
        </div>

        {/* Upcoming Holidays */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Upcoming Holidays</span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer">Calendar</span>
          </h3>

          <div className="space-y-2.5">
            {upcomingHolidays.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-slate-100">{h.name}</h5>
                  <p className="text-[11px] text-slate-400">{h.date} • {h.day}</p>
                </div>
                <Badge variant="neutral" size="sm">{h.type}</Badge>
              </div>
            ))}
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
          {recentPayslips.map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.month}</span>
                <Badge variant="success" size="sm">{p.status}</Badge>
              </div>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{p.net}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>Disbursed: {p.date}</span>
                <button type="button" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5">
                  PDF <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
