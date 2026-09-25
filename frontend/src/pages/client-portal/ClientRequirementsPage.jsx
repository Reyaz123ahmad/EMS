import React, { useState } from 'react';
import { useClientProjects, useCreateRequirement } from '../../hooks/useClientPortal.js';
import { FileText, Send, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ClientRequirementsPage() {
  const { data: projectData } = useClientProjects();
  const { mutateAsync: createRequirement, isPending } = useCreateRequirement();

  const projects = projectData?.projects || [];

  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createRequirement(formData);
      setFormData({
        projectId: '',
        title: '',
        description: '',
        priority: 'MEDIUM'
      });
    } catch (err) {
      // toast in hook
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Submit New Requirement</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Request feature additions, scope modifications, or system revisions for your active projects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Target Project <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Choose project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Requirement Summary / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Export payroll reports to Excel format"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent / Blocker</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Detailed Specifications & Acceptance Criteria <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={5}
            placeholder="Describe the expected user workflow, input fields, business logic, or technical constraints..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Logging Requirement...' : 'Submit Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClientRequirementsPage;
