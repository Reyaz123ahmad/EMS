import React from 'react';
import {
  Users,
  UserCheck,
  CalendarCheck,
  FileCheck2,
  Clock,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import MyShiftCard from '../../components/dashboard/MyShiftCard';

export const HRManagerDashboard = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hrManagerDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/hr-manager');
      return response.data?.data || response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading HR Operations...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load operations metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const teamSize = dashboardData?.teamSize || 0;
  const presentToday = dashboardData?.presentToday || 0;
  const lateToday = dashboardData?.lateToday || 0;
  const pendingApprovals = dashboardData?.pendingApprovals || 0;
  const teamMembers = dashboardData?.teamMembers || [];

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            HR Operations & Team Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department roster monitoring, shift check-ins, biometric verifications, and approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/face-registration')} className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            Enroll Face
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Assigned Team"
          value={String(teamSize)}
          change="Department workforce"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Team Present"
          value={String(presentToday)}
          change={teamSize > 0 ? `${Math.round((presentToday / teamSize) * 100)}%` : '0%'}
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Clock}
          label="Late Today"
          value={String(lateToday)}
          change={lateToday > 0 ? 'Punctuality check' : 'On time'}
          changeType="neutral"
          variant="amber"
        />
        <StatsCard
          icon={FileCheck2}
          label="Pending Team Approvals"
          value={String(pendingApprovals)}
          change="Action required"
          variant="sky"
        />
      </div>

      {/* My Shift Overview */}
      <div className="max-w-md">
        <MyShiftCard />
      </div>

      {/* Charts & Team List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Team Attendance Performance"
            subtitle="Weekly check-in punctuality rate"
          >
            <AttendanceTrendChart data={dashboardData?.attendanceTrend || []} />
          </ChartCard>
        </div>

        {/* Team Members Real-Time Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Team Roster Live</span>
            <Badge variant="success" size="sm" dot>Live</Badge>
          </h3>

          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No team members registered.</div>
            ) : (
              teamMembers.map((m) => (
                <div key={m.id || m.code} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{m.name}</h4>
                    <p className="text-slate-500 text-[11px]">{m.role} • {m.code}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Punch: {m.inTime} ({m.method})</p>
                  </div>
                  <Badge
                    variant={m.status === 'PRESENT' ? 'success' : m.status === 'LATE' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {m.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRManagerDashboard;
