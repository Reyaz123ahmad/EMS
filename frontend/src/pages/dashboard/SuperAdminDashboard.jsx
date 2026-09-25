import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import CompanyGrowthChart from '../../components/dashboard/CompanyGrowthChart';
import AttendancePieChart from '../../components/dashboard/AttendancePieChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';

export const SuperAdminDashboard = () => {
  const [dateRange, setDateRange] = useState('30d');

  const recentCompanies = [
    { id: '1', name: 'Acme Corp', tier: 'ENTERPRISE', employees: 450, status: 'ACTIVE', joined: '2026-08-12' },
    { id: '2', name: 'TechFlow Systems', tier: 'PRO', employees: 120, status: 'ACTIVE', joined: '2026-08-18' },
    { id: '3', name: 'Global Logistics Ltd', tier: 'ENTERPRISE', employees: 1200, status: 'ACTIVE', joined: '2026-08-25' },
    { id: '4', name: 'Nexura Digital', tier: 'BASIC', employees: 45, status: 'TRIAL', joined: '2026-09-02' },
    { id: '5', name: 'CloudScale Inc', tier: 'PRO', employees: 85, status: 'ACTIVE', joined: '2026-09-10' }
  ];

  const recentPayments = [
    { id: 'TXN-9021', company: 'Global Logistics Ltd', amount: '₹1,50,000', plan: 'Enterprise Annual', status: 'SUCCESS', date: '2026-09-24' },
    { id: 'TXN-9020', company: 'Acme Corp', amount: '₹85,000', plan: 'Enterprise Monthly', status: 'SUCCESS', date: '2026-09-22' },
    { id: 'TXN-9019', company: 'TechFlow Systems', amount: '₹35,000', plan: 'Pro Monthly', status: 'SUCCESS', date: '2026-09-20' },
    { id: 'TXN-9018', company: 'CloudScale Inc', amount: '₹35,000', plan: 'Pro Monthly', status: 'SUCCESS', date: '2026-09-18' }
  ];

  const companyColumns = [
    { header: 'Company Name', accessorKey: 'name', cell: (info) => <span className="font-bold text-slate-900 dark:text-slate-100">{info.getValue()}</span> },
    { header: 'Tier Plan', accessorKey: 'tier', cell: (info) => <Badge variant={info.getValue() === 'ENTERPRISE' ? 'primary' : 'secondary'} size="sm">{info.getValue()}</Badge> },
    { header: 'Employees', accessorKey: 'employees', cell: (info) => <span>{info.getValue()} Active</span> },
    { header: 'Status', accessorKey: 'status', cell: (info) => <Badge variant={info.getValue() === 'ACTIVE' ? 'success' : 'warning'} dot size="sm">{info.getValue()}</Badge> },
    { header: 'Joined', accessorKey: 'joined' }
  ];

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
          value="142"
          change="+18%"
          changeType="increase"
          variant="indigo"
        />
        <StatsCard
          icon={CreditCard}
          label="Active Subscriptions"
          value="128"
          change="+12%"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value="₹34.5L"
          change="+24.2%"
          changeType="increase"
          variant="sky"
        />
        <StatsCard
          icon={Users}
          label="Total Platform Users"
          value="18,450"
          change="+8.5%"
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
              View all 142
            </span>
          </div>
          <DataTable columns={companyColumns} data={recentCompanies} />
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
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{p.company}</p>
                    <p className="text-[10px] text-slate-400">{p.plan}</p>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
