import React from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatsCard from '../../components/dashboard/StatsCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';

export const ClientDashboard = () => {
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clientDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/client');
      return response.data?.data || response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Client Portal...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-rose-500" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">Failed to load client portal</p>
          <p className="text-xs text-slate-500">{error?.message || 'Server error occurred'}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const projects = dashboardData?.projects || [];
  const invoices = dashboardData?.invoices || [];
  const totalInvoiced = dashboardData?.totalInvoiced || 0;
  const activeProjectsCount = dashboardData?.activeProjects || projects.length;

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Client Project & Contract Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track ongoing milestone progress, submit functional requirements, and view invoices.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Briefcase}
          label="Active Projects"
          value={String(activeProjectsCount)}
          change="Client Portfolio"
          variant="indigo"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Milestones Tracked"
          value={String(projects.length)}
          change="Active deliverables"
          variant="emerald"
        />
        <StatsCard
          icon={FileText}
          label="Total Invoices"
          value={String(invoices.length)}
          change="Billing records"
          variant="amber"
        />
        <StatsCard
          icon={DollarSign}
          label="Total Invoiced"
          value={`₹${(Number(totalInvoiced) || 0).toLocaleString('en-IN')}`}
          change="Accounts status"
          variant="violet"
        />
      </div>

      {/* Projects List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Ongoing Project Milestones
        </h3>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No active projects linked to this client account.</div>
          ) : (
            projects.map((proj) => (
              <div key={proj.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{proj.name}</h4>
                    <p className="text-xs text-slate-500">
                      Budget: ₹{(Number(proj.budget) || 0).toLocaleString('en-IN')} • Status: {proj.status}
                    </p>
                  </div>
                  <Badge variant="primary" size="sm">
                    {proj.status || 'ACTIVE'}
                  </Badge>
                </div>

                <Progress value={proj.progress || 0} max={100} label="Sprint Progress" showLabel variant="primary" size="md" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
          <span>Billing & Invoices</span>
        </h3>

        <div className="space-y-2.5">
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No invoices issued for this client.</div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber || inv.id}</p>
                  <p className="text-[11px] text-slate-400">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{(Number(inv.totalAmount) || 0).toLocaleString('en-IN')}
                  </span>
                  <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'} size="sm">{inv.status}</Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
