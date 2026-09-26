import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert,
  FileCheck2,
  CalendarCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api.js';
import approvalsService from '../../services/approvals.service.js';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import AttendancePieChart from '../../components/dashboard/AttendancePieChart';
import RecentActivity from '../../components/dashboard/RecentActivity';
import QuickActions from '../../components/dashboard/QuickActions';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import MyShiftCard from '../../components/dashboard/MyShiftCard';

export const CompanyAdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['companyAdminDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/company-admin');
      return response.data?.data || response.data;
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approvalsService.approveRequest(id),
    onSuccess: () => {
      toast.success('Approval request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['companyAdminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => approvalsService.rejectRequest(id),
    onSuccess: () => {
      toast.success('Approval request rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['companyAdminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to reject request');
    }
  });

  const quickActionsList = [
    { label: 'Register Employee', icon: Users, onClick: () => navigate('/employees'), bgClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400', description: 'Add new staff member' },
    { label: 'Face Biometric', icon: UserCheck, onClick: () => navigate('/face-registration'), bgClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400', description: 'Enroll face vector' },
    { label: 'Generate QR Badges', icon: CreditCard, onClick: () => navigate('/card-attendance'), bgClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400', description: 'Print CR80 badges' },
    { label: 'Security Review', icon: ShieldAlert, onClick: () => navigate('/settings/security'), bgClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400', description: 'Review spoof alerts' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Organization Overview...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load organization metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const totalHeadcount = dashboardData?.totalEmployees || 0;
  const presentToday = dashboardData?.presentToday || 0;
  const lateToday = dashboardData?.lateToday || 0;
  const onLeaveToday = dashboardData?.onLeaveToday || 0;
  const absentToday = dashboardData?.absentToday || 0;
  const pendingApprovals = dashboardData?.pendingApprovals || [];

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
          value={String(totalHeadcount)}
          change={`${dashboardData?.activeEmployees || 0} active`}
          changePeriod="in organization"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value={String(presentToday)}
          change={totalHeadcount > 0 ? `${Math.round((presentToday / totalHeadcount) * 100)}%` : '0%'}
          changeType="increase"
          changePeriod="attendance rate"
          variant="emerald"
        />
        <StatsCard
          icon={Clock}
          label="Late Arrival"
          value={String(lateToday)}
          change={lateToday > 0 ? 'Action required' : 'On time'}
          changeType="neutral"
          variant="amber"
        />
        <StatsCard
          icon={UserX}
          label="Absent / Leave"
          value={String(absentToday + onLeaveToday)}
          change={`${onLeaveToday} on leave`}
          changeType="decrease"
          variant="rose"
        />
      </div>

      {/* My Shift & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div>
          <MyShiftCard />
        </div>
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Quick Management Actions
          </h3>
          <QuickActions actions={quickActionsList} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Weekly Attendance & Punctuality"
            subtitle="Present vs late percentage trends across all shifts"
          >
            <AttendanceTrendChart data={dashboardData?.attendanceTrend || []} />
          </ChartCard>
        </div>

        <div>
          <ChartCard
            title="Today's Headcount Ratio"
            subtitle={`Live breakdown of ${totalHeadcount} employees`}
          >
            <AttendancePieChart data={dashboardData?.attendanceBreakdown || []} />
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
            <span 
              onClick={() => navigate('/settings/leave')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Review all
            </span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No pending approvals waiting for review.
              </div>
            ) : (
              pendingApprovals.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {req.workflow?.name || req.entityType || 'Approval Request'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Requested on {new Date(req.createdAt).toLocaleDateString()} • Level {req.currentLevel || 1}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="primary" 
                      size="xs"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => approveMutation.mutate(req.id)}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs"
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(req.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
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
