import React from 'react';
import { Users, CalendarCheck2, Clock, ShieldCheck, TrendingUp } from 'lucide-react';
import useAuthStore from '../../store/auth.store.js';

export function DashboardPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || user?.userRoles?.[0]?.role?.name || 'SUPER_ADMIN';

  const stats = [
    { label: 'Total Employees', value: '142', change: '+12% this month', icon: Users, color: 'text-blue-400' },
    { label: 'Today Attendance', value: '96.4%', change: '137 Checked In', icon: CalendarCheck2, color: 'text-emerald-400' },
    { label: 'Pending Leaves', value: '4', change: 'Requires review', icon: Clock, color: 'text-amber-400' },
    { label: 'Security Score', value: '99.8%', change: 'Airtight compliance', icon: ShieldCheck, color: 'text-indigo-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-900/30 p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Control Center
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Role: <span className="font-semibold text-blue-400">{userRole}</span> • Platform Active & Synchronized with Supabase
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational (v2.0)
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DashboardPage;
