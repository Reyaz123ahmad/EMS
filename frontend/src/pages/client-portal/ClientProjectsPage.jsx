import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientProjects } from '../../hooks/useClientPortal.js';
import { FolderKanban, Search, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ClientProjectsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useClientProjects({ search });

  const projects = data?.projects || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Your Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View milestones, deliverables, and progress tracking across all your contracts.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search project by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading your projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No projects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            There are currently no active projects matching your query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                  {p.description || 'Enterprise project contract deliverable.'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Started: {p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <Link
                  to={`/client-portal/projects/${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  View Milestones & Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientProjectsPage;
