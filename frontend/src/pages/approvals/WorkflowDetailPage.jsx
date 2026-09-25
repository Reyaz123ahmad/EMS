import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflow, useUpdateWorkflow } from '../../hooks/useApprovals.js';
import WorkflowLevelEditor from '../../components/approvals/WorkflowLevelEditor.jsx';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import { toast } from 'sonner';

export function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: workflow, isLoading } = useWorkflow(id);
  const { mutateAsync: updateWf, isPending: isUpdating } = useUpdateWorkflow();

  const [form, setForm] = useState({
    name: '',
    entityType: 'LEAVE',
    levels: [],
  });

  useEffect(() => {
    if (workflow) {
      setForm({
        name: workflow.name || '',
        entityType: workflow.entityType || 'LEAVE',
        levels: Array.isArray(workflow.levels)
          ? workflow.levels
          : typeof workflow.levels === 'string'
          ? JSON.parse(workflow.levels)
          : [],
      });
    }
  }, [workflow]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateWf({ id, data: form });
      toast.success('Workflow levels updated');
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-400">Loading workflow...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/approvals/workflows')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Workflows
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <Layers className="h-6 w-6 text-indigo-600" />
          Edit Approval Workflow
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure stage reviewers and order of authority.
        </p>
      </div>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Workflow Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Entity Category
            </label>
            <input
              type="text"
              disabled
              value={form.entityType}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <WorkflowLevelEditor
          levels={form.levels}
          onChange={(levels) => setForm({ ...form, levels })}
        />

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isUpdating}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isUpdating ? 'Saving...' : 'Save Workflow Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkflowDetailPage;
