import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Briefcase, 
  Search, 
  RefreshCw, 
  Calendar, 
  Users, 
  ArrowRight, 
  CheckSquare, 
  AlertCircle,
  Clock
} from 'lucide-react';
import projectService from '../../services/project.service.js';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => projectService.getProjects()
  });

  const projects = Array.isArray(data) ? data : (data?.projects || []);

  const filteredProjects = projects.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    return name.includes(term) || desc.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-indigo-400" />
            Projects & Task Workspaces
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise project portfolio, client contract deliverables, milestone tracking, and task sprints
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-sm"
          >
            <CheckSquare className="w-4 h-4" />
            All Tasks Board
          </Link>
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
            placeholder="Search projects by name, description or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="p-12 text-center space-y-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading project workspaces...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 rounded-xl bg-slate-900 border border-slate-800">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Unable to load projects</h3>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center space-y-3 rounded-xl bg-slate-900 border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-medium text-slate-300">No projects found</h3>
          <p className="text-sm text-slate-500">Project workspaces and task boards will appear here.</p>
          <div className="pt-2">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition"
            >
              <CheckSquare className="w-4 h-4" /> Go to Tasks Board
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => (
            <div key={p.id} className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100 truncate">{p.name || 'Project'}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    p.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {p.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description || 'No description provided'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{p.deadline ? new Date(p.deadline).toLocaleDateString() : 'Active sprint'}</span>
                </div>

                <Link
                  to={`/projects/${p.id}/tasks`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  View Tasks <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
