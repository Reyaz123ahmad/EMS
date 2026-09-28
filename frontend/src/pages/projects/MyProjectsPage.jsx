import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FolderOpen, 
  Search, 
  RefreshCw, 
  Building2, 
  CheckSquare, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  Clock,
  Award
} from 'lucide-react';
import projectService from '../../services/project.service.js';

export default function MyProjectsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['my-projects-list'],
    queryFn: () => projectService.getMyProjects()
  });

  const projects = Array.isArray(data) ? data : (data?.projects || []);

  const filteredProjects = projects.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const clientName = (p.client?.name || '').toLowerCase();
    const role = (p.myRole || '').toLowerCase();
    return name.includes(term) || clientName.includes(term) || role.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderOpen className="w-7 h-7 text-indigo-400" />
            My Projects & Sprints
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Projects and sprint deliverables where you are assigned as a project member or manager
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my projects by title, client or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="p-16 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading your project workspaces...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 rounded-xl bg-slate-900 border border-slate-800">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Unable to load projects</h3>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-xl bg-slate-900 border border-slate-800">
          <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-medium text-slate-300">No project assignments found</h3>
          <p className="text-sm text-slate-500">You have not been assigned to any project team yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const client = p.client || {};
            const pct = p.progress || 0;

            return (
              <div key={p.id} className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-100 line-clamp-1">{p.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
                      {p.myRole || 'MEMBER'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Client: <strong className="text-slate-300">{client.name || 'Corporate'}</strong></span>
                  </p>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {p.description || 'Deliverable sprint milestone'}
                  </p>

                  {/* Task Stats & Progress Bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Tasks: {p.completedTasks || 0}/{p.totalTasks || 0}</span>
                      </span>
                      <span className="font-semibold text-slate-200">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    p.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {p.status || 'ACTIVE'}
                  </span>

                  <Link
                    to={`/my-projects/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    View Project <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
