import React from 'react';
import {
  Users,
  UserCheck,
  Calendar,
  FileCheck2,
  Cake,
  ShieldAlert,
  FileText,
  Clock
} from 'lucide-react';
import StatsCard from '../../components/dashboard/StatsCard';
import ChartCard from '../../components/dashboard/ChartCard';
import AttendanceTrendChart from '../../components/dashboard/AttendanceTrendChart';
import AttendancePieChart from '../../components/dashboard/AttendancePieChart';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

export const HRAdminDashboard = () => {
  const pendingLeaves = [
    { id: '1', employee: 'Sandeep Kumar', type: 'Annual Leave', days: '3 Days', dates: '28 Sep - 30 Sep', balance: '12 Days Left' },
    { id: '2', employee: 'Priya Sharma', type: 'Maternity Leave', days: '84 Days', dates: '01 Oct - 24 Dec', balance: 'Eligible' },
    { id: '3', employee: 'Kunal Patil', type: 'Casual Leave', days: '1 Day', dates: '29 Sep', balance: '4 Days Left' }
  ];

  const celebrations = [
    { name: 'Arjun Kapoor', event: 'Birthday', date: 'Tomorrow', department: 'Design' },
    { name: 'Simran Sethi', event: '2-Year Anniversary', date: '28 Sep', department: 'Engineering' }
  ];

  const pendingDocs = [
    { employee: 'Vikas Rao', doc: 'PAN Card Verification', submitted: 'Yesterday' },
    { employee: 'Ananya Roy', doc: 'Address Proof (Aadhar)', submitted: '2 days ago' }
  ];

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

        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm">
            + Onboard New Hire
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Employees"
          value="168"
          change="+6 this quarter"
          variant="indigo"
        />
        <StatsCard
          icon={UserCheck}
          label="Active Present"
          value="142"
          change="84.5%"
          changeType="increase"
          variant="emerald"
        />
        <StatsCard
          icon={Calendar}
          label="On Approved Leave"
          value="8"
          change="5 planned"
          variant="sky"
        />
        <StatsCard
          icon={FileCheck2}
          label="Pending Approvals"
          value="5"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Requests */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Pending Leave Requests</span>
            <Badge variant="warning" size="sm">3 Pending</Badge>
          </h3>
          <div className="space-y-2.5">
            {pendingLeaves.map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                  <span>{l.employee}</span>
                  <Badge variant="primary" size="sm">{l.type}</Badge>
                </div>
                <p className="text-slate-500 mt-1">{l.dates} ({l.days}) • {l.balance}</p>
                <div className="flex gap-2 mt-2.5">
                  <Button variant="primary" size="xs">Approve</Button>
                  <Button variant="outline" size="xs">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Verifications */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Document Verifications
          </h3>
          <div className="space-y-2.5">
            {pendingDocs.map((doc, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <p className="font-bold text-slate-900 dark:text-slate-100">{doc.employee}</p>
                <p className="text-slate-500 mt-0.5">{doc.doc}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400">{doc.submitted}</span>
                  <Button variant="outline" size="xs">Verify</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Celebrations & Milestones */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur-md space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Cake className="w-5 h-5 text-rose-500" />
            Celebrations & Milestones
          </h3>
          <div className="space-y-2.5">
            {celebrations.map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs">
                <div className="flex items-center justify-between font-bold text-rose-900 dark:text-rose-200">
                  <span>{c.name}</span>
                  <Badge variant="danger" size="sm">{c.date}</Badge>
                </div>
                <p className="text-rose-600 dark:text-rose-300 mt-1">{c.event} • {c.department}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRAdminDashboard;
