import React from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';

export const ClientDashboard = () => {
  const projects = [
    { name: 'Core SaaS Migration', progress: 78, status: 'IN_PROGRESS', budget: '₹12,50,000', deadline: '15 Oct 2026' },
    { name: 'Biometric Mobile App (React Native)', progress: 95, status: 'UAT_REVIEW', budget: '₹8,000,000', deadline: '30 Sep 2026' },
    { name: 'AI Face Anti-Spoofing Model', progress: 40, status: 'IN_PROGRESS', budget: '₹6,50,000', deadline: '15 Nov 2026' }
  ];

  const recentRequirements = [
    { title: 'Add offline fingerprint template caching', priority: 'HIGH', status: 'IN_DEVELOPMENT', date: '22 Sep' },
    { title: 'Export CR80 badges in bulk ZIP', priority: 'MEDIUM', status: 'COMPLETED', date: '18 Sep' }
  ];

  const recentInvoices = [
    { id: 'INV-2026-08', amount: '₹4,50,000', date: '01 Sep 2026', status: 'PAID' },
    { id: 'INV-2026-07', amount: '₹4,50,000', date: '01 Aug 2026', status: 'PAID' }
  ];

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

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm">
            + New Requirement
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Briefcase}
          label="Active Projects"
          value="3"
          change="All On Track"
          variant="indigo"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Milestones Achieved"
          value="14 / 18"
          change="77.7% Completion"
          variant="emerald"
        />
        <StatsCard
          icon={FileText}
          label="Open Requirements"
          value="2"
          change="1 in development"
          variant="amber"
        />
        <StatsCard
          icon={DollarSign}
          label="Total Invoiced"
          value="₹27.0L"
          change="Zero overdue"
          variant="violet"
        />
      </div>

      {/* Projects List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Ongoing Project Milestones
        </h3>

        <div className="space-y-4">
          {projects.map((proj, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{proj.name}</h4>
                  <p className="text-xs text-slate-500">Budget: {proj.budget} • Target Deadline: {proj.deadline}</p>
                </div>
                <Badge variant={proj.status === 'UAT_REVIEW' ? 'warning' : 'primary'} size="sm">
                  {proj.status.replace('_', ' ')}
                </Badge>
              </div>

              <Progress value={proj.progress} max={100} label="Sprint Progress" showLabel variant="primary" size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid: Requirements & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requirements */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Recent Requirements</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">View All</span>
          </h3>

          <div className="space-y-2.5">
            {recentRequirements.map((req, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-100">
                  <span>{req.title}</span>
                  <Badge variant={req.priority === 'HIGH' ? 'danger' : 'neutral'} size="sm">{req.priority}</Badge>
                </div>
                <div className="flex items-center justify-between text-slate-400 mt-2 text-[11px]">
                  <span>Submitted: {req.date}</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{req.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Billing & Invoices</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">History</span>
          </h3>

          <div className="space-y-2.5">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{inv.id}</p>
                  <p className="text-[11px] text-slate-400">Date: {inv.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{inv.amount}</span>
                  <Badge variant="success" size="sm">{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
