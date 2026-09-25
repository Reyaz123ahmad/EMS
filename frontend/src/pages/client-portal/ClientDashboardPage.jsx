import React from 'react';
import { Link } from 'react-router-dom';
import { useClientDashboard } from '../../hooks/useClientPortal.js';
import { FolderKanban, FileText, IndianRupee, MessageSquare, CheckCircle2, Clock, ArrowRight, ShieldCheck } from 'lucide-react';

export function ClientDashboardPage() {
  const { data, isLoading } = useClientDashboard();

  const projects = data?.projects || [];
  const activeProjectsCount = data?.activeProjectsCount || projects.length;
  const recentRequirements = data?.recentRequirements || [];
  const invoices = data?.invoices || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-400/30 inline-block">
            Client Self-Service Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Your Project Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Track deliverables, review milestone progress, log technical requirements, and view billing history.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/client-portal/projects"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-indigo-500 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Projects</span>
            <FolderKanban className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{activeProjectsCount}</h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium inline-flex items-center gap-1 mt-2">
            View deliverables <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          to="/client-portal/requirements"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-purple-500 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Requirements</span>
            <FileText className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{recentRequirements.length || 0}</h3>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium inline-flex items-center gap-1 mt-2">
            Submit new requirement <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          to="/client-portal/invoices"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Billing & Invoices</span>
            <IndianRupee className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{invoices.length || 0}</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 mt-2">
            Download PDF invoices <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          to="/client-portal/comments"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Project Discussions</span>
            <MessageSquare className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Active</h3>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1 mt-2">
            Post comments & review <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Projects Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Projects & Contracts</h3>
          <Link to="/client-portal/projects" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View all
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No active projects assigned yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/client-portal/projects/${p.id}`}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description || 'Enterprise project contract'}</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-semibold">
                    {p.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDashboardPage;
