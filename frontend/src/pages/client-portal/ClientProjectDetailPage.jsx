import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClientProjectDetail } from '../../hooks/useClientPortal.js';
import { ArrowLeft, FolderKanban, Calendar, Users, FileText, CheckCircle2, Clock } from 'lucide-react';

export function ClientProjectDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useClientProjectDetail(id);

  const project = data?.project || data;

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Project not found</h3>
        <Link to="/client-portal/projects" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Return to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          to="/client-portal/projects"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Project ID: {project.id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
            <div className="mt-1">
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                {project.status}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start Date</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Completion</span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Active Ongoing'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scope & Description</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {project.description || 'Enterprise project agreement deliverables and architectural implementation.'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Link
            to="/client-portal/requirements"
            className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100"
          >
            + Add Requirement
          </Link>
          <Link
            to="/client-portal/comments"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
          >
            Post Comment / Discussion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClientProjectDetailPage;
