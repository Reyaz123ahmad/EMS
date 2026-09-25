import React, { useState } from 'react';
import { useClientProjects, useAddComment } from '../../hooks/useClientPortal.js';
import { MessageSquare, Send, User, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function ClientCommentsPage() {
  const { data: projectData } = useClientProjects();
  const { mutateAsync: addComment, isPending } = useAddComment();

  const projects = projectData?.projects || [];

  const [formData, setFormData] = useState({
    projectId: '',
    content: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectId || !formData.content) {
      toast.error('Please choose a project and type a comment');
      return;
    }

    try {
      await addComment(formData);
      setFormData({ ...formData, content: '' });
    } catch (err) {
      // toast in hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Project Discussions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Collaborate with the EMS development team and engineering leads on open deliverables.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Discussion Channel / Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- Choose Project Channel --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Post a Comment or Question
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={3}
              placeholder="Type your message, query, or feedback here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {isPending ? 'Sending...' : 'Post Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientCommentsPage;
