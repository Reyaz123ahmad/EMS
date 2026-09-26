import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  CreditCard,
  TrendingUp,
  Users,
  Server,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Activity,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import CompanyGrowthChart from '../../components/dashboard/CompanyGrowthChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';

export const SuperAdminDashboard = () => {
  const [dateRange, setDateRange] = useState('30d');

  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['superAdminDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/super-admin');
      return response.data?.data || response.data;
    }
  });

  const recentCompanies = (dashboardData?.recentCompanies || []).map((c) => ({
    id: c.id,
    name: c.name,
    tier: c.subscription?.plan?.name || c.subscriptions?.[0]?.plan?.name || 'TRIAL',
    status: c.status || 'ACTIVE',
    joined: new Date(c.createdAt).toLocaleDateString()
  }));

  const recentPayments = (dashboardData?.recentPayments || []).map((p) => ({
    id: p.id || p.transactionId || 'TXN',
    company: p.subscription?.company?.name || 'Enterprise Tenant',
    plan: p.subscription?.plan?.name || 'Enterprise Annual',
    amount: `₹${(Number(p.amount) || 0).toLocaleString('en-IN')}`,
    status: p.status || 'PAID',
    date: new Date(p.createdAt).toLocaleDateString()
  }));

  const companyColumns = [
    { header: 'Company Name', accessorKey: 'name', cell: (info) => <span className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</span> },
    { header: 'Tier Plan', accessorKey: 'tier', cell: (info) => <Badge variant={info.getValue() === 'ENTERPRISE' ? 'primary' : 'secondary'} size="sm">{info.getValue()}</Badge> },
    { header: 'Status', accessorKey: 'status', cell: (info) => <Badge variant={info.getValue() === 'ACTIVE' ? 'success' : 'warning'} dot size="sm">{info.getValue()}</Badge> },
    { header: 'Joined', accessorKey: 'joined' }
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Platform Metrics...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load platform metrics</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Super Admin Platform Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global multi-tenant overview, subscription metrics, revenue streams, and system health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="1y">Past Year</option>
          </select>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Audit
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Building2}
          label="Total Tenants"
          value={String(dashboardData?.totalCompanies || 0)}
          change={`${dashboardData?.activeCompanies || 0} active`}
          changeType="increase"
          variant="indigo"
        />
        <StatsCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={String(dashboardData?.totalSubscriptions || 0)}
          change="Platform active"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={TrendingUp}
          label="Total Platform Revenue"
          value={`₹${(Number(dashboardData?.totalRevenue) || 0).toLocaleString('en-IN')}`}
          change={`MRR: ₹${(Number(dashboardData?.mrr) || 0).toLocaleString('en-IN')}`}
          changeType="increase"
          variant="sky"
        />
        <StatsCard
          icon={Users}
          label="Total Platform Users"
          value={String(dashboardData?.totalUsers || 0)}
          change="Across all tenants"
          changeType="increase"
          variant="violet"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Tenant Growth Trend"
          subtitle="New tenant onboardings over past 6 months"
        >
          <CompanyGrowthChart />
        </ChartCard>

        <ChartCard
          title="Revenue & Growth Projection"
          subtitle="Monthly recurring revenue (MRR in INR)"
        >
          <RevenueChart />
        </ChartCard>
      </div>

      {/* Tables & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Companies Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recently Onboarded Companies
            </h3>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
              Total: {dashboardData?.totalCompanies || 0}
            </span>
          </div>
          {recentCompanies.length > 0 ? (
            <DataTable columns={companyColumns} data={recentCompanies} />
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">No companies onboarded yet</div>
          )}
        </div>

        {/* System Health Widget */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Infrastructure Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Database (PostgreSQL)</span>
              <Badge variant="success" size="sm" dot>99.98% Healthy</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">BullMQ Redis Queue</span>
              <Badge variant="success" size="sm" dot>6 Workers Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Socket.io Clusters</span>
              <Badge variant="success" size="sm" dot>100% Online</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Biometric Sync Engine</span>
              <Badge variant="success" size="sm" dot>Idle (Normal)</Badge>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
              Recent Transactions
            </h4>
            <div className="space-y-2">
              {recentPayments.length > 0 ? (
                recentPayments.map((p, idx) => (
                  <div key={p.id || idx} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{p.company}</p>
                      <p className="text-[10px] text-slate-400">{p.plan}</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.amount}</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 py-2">No recent transactions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
