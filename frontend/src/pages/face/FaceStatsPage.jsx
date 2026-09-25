import React from 'react';
import { useFaceStats } from '../../hooks/useFaceRegistration';
import { BarChart3, ShieldCheck, Users, Sparkles, PieChart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FaceStatsPage() {
  const { data: statsData, isLoading } = useFaceStats();
  const stats = statsData?.data || { totalEmployees: 0, registeredCount: 0, pendingCount: 0, percentage: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Face Biometrics Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry on facial vector deployment, model vector integrity, and enrollment coverage.
          </p>
        </div>

        <Link
          to="/face/register"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition w-fit"
        >
          <Sparkles className="w-4 h-4" />
          Enroll New Face
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Total Active Workforce</span>
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white">{stats.totalEmployees}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Enrolled Face Profiles</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.registeredCount}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Pending Enrollment</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.pendingCount}</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider">Biometric Coverage</span>
            <PieChart className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400">{stats.percentage}%</div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-2">Overall Biometric Deployment Coverage</h3>
        <p className="text-xs text-slate-400 mb-6">
          Organizations with &gt;90% enrollment coverage achieve automated fraud reduction and sub-second attendance verification.
        </p>

        <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden mb-4">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-1000"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
          <span>{stats.registeredCount} of {stats.totalEmployees} Employees Enrolled</span>
          <span>{stats.percentage}% Completed</span>
        </div>
      </div>
    </div>
  );
}
