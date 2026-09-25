import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflows, useCreateWorkflow, useDeleteWorkflow } from '../../hooks/useApprovals.js';
import WorkflowCard from '../../components/approvals/WorkflowCard.jsx';
import WorkflowLevelEditor from '../../components/approvals/WorkflowLevelEditor.jsx';
import { Plus, Layers, X } from 'lucide-react';
import { toast } from 'sonner';

export function WorkflowsPage() {
  const navigate = useNavigate();
  const { data: workflows = [], isLoading } = useWorkflows();
  const { mutateAsync: createWorkflow, isPending: isCreating } = useCreateWorkflow();
  const { mutateAsync: deleteWorkflow } = useDeleteWorkflow();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    entityType: 'LEAVE',
    levels: [
      { level: 1, role: 'MANAGER', name: 'Direct Manager' },
      { level: 2, role: 'HR_ADMIN', name: 'HR Department' },
    ],
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please provide a workflow name');
      return;
    }
    try {
      await createWorkflow(formData);
      toast.success('Approval workflow created successfully');
      setShowModal(false);
      setFormData({
        name: '',
        entityType: 'LEAVE',
        levels: [
          { level: 1, role: 'MANAGER', name: 'Direct Manager' },
          { level: 2, role: 'HR_ADMIN', name: 'HR Department' },
        ],
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create workflow');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this approval workflow?')) {
      try {
        await deleteWorkflow(id);
        toast.success('Workflow deleted');
      } catch (err) {
        toast.error(err.message || 'Delete failed');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Approval Workflows
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build tiered multi-level approval hierarchies for leaves, expenses, overtime, and assets.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
        >
          <Plus className="h-4 w-4" /> New Workflow
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Layers className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Custom Workflows</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create multi-tier approval chains to route employee applications smoothly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onClick={() => navigate(`/approvals/workflows/${wf.id}`)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Create Approval Hierarchy
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tier-2 Leave Approval"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Entity Category
                </label>
                <select
                  value={formData.entityType}
                  onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-semibold"
                >
                  <option value="LEAVE">Leave Management</option>
                  <option value="OVERTIME">Overtime Requests</option>
                  <option value="EXPENSE">Expense Claims</option>
                  <option value="ATTENDANCE">Emergency Attendance</option>
                  <option value="ASSET">Asset Allocation</option>
                  <option value="GENERAL">General Request</option>
                </select>
              </div>

              <WorkflowLevelEditor
                levels={formData.levels}
                onChange={(levels) => setFormData({ ...formData, levels })}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Save Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkflowsPage;
