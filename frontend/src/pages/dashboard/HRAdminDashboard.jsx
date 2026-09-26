import React from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  FileCheck2,
  Cake,
  ShieldAlert,
  FileText,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../services/api';
import approvalsService from '../../services/approvals.service';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import AttendancePieChart from '../../components/dashboard/AttendancePieChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const HRAdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hrAdminDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/hr-admin');
      return response.data?.data || response.data;
    }
  });

  const approveLeaveMutation = useMutation({
    mutationFn: (id) => api.put(`/leave/requests/${id}`, { status: 'APPROVED' }),
    onSuccess: () => {
      toast.success('Leave approved successfully');
      queryClient.invalidateQueries({ queryKey: ['hrAdminDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve leave');
    }
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: (id) => api.put(`/leave/requests/${id}`, { status: 'REJECTED' }),
    onSuccess: () => {
      toast.success('Leave rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['hrAdminDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject leave');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading HR Overview...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load HR metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const totalEmployees = dashboardData?.totalEmployees || 0;
  const presentToday = dashboardData?.presentToday || 0;
  const onLeaveToday = dashboardData?.onLeaveToday || 0;
  const pendingLeaves = dashboardData?.pendingLeaves || [];
  const pendingDocs = dashboardData?.pendingDocs || [];
  const pendingApprovalsCount = dashboardData?.pendingApprovals || 0;

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            HR Administration Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage employee lifecycle, leave workflows, document verifications, and compliance.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Employees"
          value={String(totalEmployees)}
          change="Registered workforce"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Active Present"
          value={String(presentToday)}
          change={totalEmployees > 0 ? `${Math.round((presentToday / totalEmployees) * 100)}%` : '0%'}
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Calendar}
          label="On Approved Leave"
          value={String(onLeaveToday)}
          change={`${onLeaveToday} planned`}
          variant="sky"
        />
        <StatsCard
          icon={FileCheck2}
          label="Pending Approvals"
          value={String(pendingApprovalsCount + pendingLeaves.length)}
          change="Action required"
          changeType="decrease"
          variant="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Attendance & Punctuality Trend"
          subtitle="Monthly attendance overview"
        >
          <AttendanceTrendChart />
        </ChartCard>

        <ChartCard
          title="Department Leave Distribution"
          subtitle="Headcount split by attendance status"
        >
          <AttendancePieChart />
        </ChartCard>
      </div>

      {/* HR Workflow Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Pending Leave Requests</span>
            <Badge variant="warning" size="sm">{pendingLeaves.length} Pending</Badge>
          </h3>
          <div className="space-y-2.5">
            {pendingLeaves.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No pending leave applications.</div>
            ) : (
              pendingLeaves.map((l) => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>{l.employee?.firstName} {l.employee?.lastName}</span>
                    <Badge variant="primary" size="sm">{l.leaveType?.name || 'Leave'}</Badge>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.totalDays || 1} Days)
                  </p>
                  <div className="flex gap-2 mt-2.5">
                    <Button 
                      variant="primary" 
                      size="xs"
                      onClick={() => approveLeaveMutation.mutate(l.id)}
                      disabled={approveLeaveMutation.isPending || rejectLeaveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="xs"
                      onClick={() => rejectLeaveMutation.mutate(l.id)}
                      disabled={approveLeaveMutation.isPending || rejectLeaveMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Document Verifications */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Document Verifications
          </h3>
          <div className="space-y-2.5">
            {pendingDocs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No document verifications pending.</div>
            ) : (
              pendingDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{doc.employee?.firstName} {doc.employee?.lastName}</p>
                  <p className="text-slate-500 mt-0.5">{doc.documentType || 'Verification Doc'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    <Badge variant="warning" size="sm">Verification Pending</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRAdminDashboard;
