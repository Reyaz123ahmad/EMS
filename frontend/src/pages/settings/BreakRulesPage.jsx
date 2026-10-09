import React, { useState } from 'react';
import {
  Coffee,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Badge from '../../components/ui/Badge.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import useAuthStore from '../../store/auth.store.js';
import {
  useBreakRules,
  useCreateBreakRule,
  useUpdateBreakRule,
  useDeleteBreakRule,
} from '../../hooks/useBreakRules.js';

export default function BreakRulesPage() {
  const { user } = useAuthStore();
  const userRoles = user?.roles || (user?.role ? [user.role] : ['EMPLOYEE']);
  const isCompanyAdmin = userRoles.includes('COMPANY_ADMIN') || userRoles.includes('SUPER_ADMIN');

  const { data: rules = [], isLoading, refetch } = useBreakRules();
  const createMutation = useCreateBreakRule();
  const updateMutation = useUpdateBreakRule();
  const deleteMutation = useDeleteBreakRule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 15,
    maxPerShift: 1,
    isPaid: true,
    isActive: true,
  });

  if (!isCompanyAdmin) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Only Company Administrators have permission to manage custom break rules and shift policies.
        </p>
      </Card>
    );
  }

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      durationMinutes: 15,
      maxPerShift: 1,
      isPaid: true,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      durationMinutes: rule.durationMinutes || 15,
      maxPerShift: rule.maxPerShift || 1,
      isPaid: rule.isPaid !== undefined ? rule.isPaid : true,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Break rule name is required');
      return;
    }

    try {
      if (editingRule) {
        await updateMutation.mutateAsync({
          id: editingRule.id,
          data: {
            name: formData.name.trim(),
            durationMinutes: Number(formData.durationMinutes),
            maxPerShift: Number(formData.maxPerShift),
            isPaid: Boolean(formData.isPaid),
            isActive: Boolean(formData.isActive),
          },
        });
        toast.success('Break rule updated successfully');
      } else {
        await createMutation.mutateAsync({
          name: formData.name.trim(),
          durationMinutes: Number(formData.durationMinutes),
          maxPerShift: Number(formData.maxPerShift),
          isPaid: Boolean(formData.isPaid),
          isActive: Boolean(formData.isActive),
        });
        toast.success('Break rule created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save break rule');
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingId) return;
    try {
      await deleteMutation.mutateAsync(deactivatingId);
      toast.success('Break rule deactivated');
      setDeactivatingId(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to deactivate break rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            Company Break Policies
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define standardized break quotas (e.g. Lunch, Tea Break) and bind them to employee work shifts.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Break Rule
        </Button>
      </div>

      {/* Rules Table / Cards */}
      <Card className="overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading break rules...</div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Coffee className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Custom Break Rules Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first custom break rule to assign specific durations and limits to your company shifts.
            </p>
            <Button onClick={handleOpenCreate} size="sm" variant="outline" className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Create Break Rule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Max / Shift</th>
                  <th className="py-3.5 px-4">Compensation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{rule.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {rule.durationMinutes} mins
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        {rule.maxPerShift} per shift
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {rule.isPaid ? (
                        <Badge variant="success" className="text-[10px]">
                          Paid Break
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="text-[10px]">
                          Unpaid Break
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {rule.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEdit(rule)}
                        className="h-8 px-2.5 text-slate-600 hover:text-indigo-600"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      {rule.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeactivatingId(rule.id)}
                          className="h-8 px-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Break Rule' : 'Create New Break Rule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rule Name *
            </label>
            <Input
              placeholder="e.g. Lunch Break, Afternoon Tea, Quick Rest"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Minutes) *
              </label>
              <Input
                type="number"
                min="5"
                max="120"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Allowed Per Shift *
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.maxPerShift}
                onChange={(e) => setFormData({ ...formData, maxPerShift: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Paid Break (Does not deduct working hours)
              </span>
            </label>

            {editingRule && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Rule is Active
                </span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deactivatingId)}
        onClose={() => setDeactivatingId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Break Rule"
        message="Are you sure you want to deactivate this break rule? Existing shifts using it will retain historical records, but new assignments will not use inactive rules."
        confirmText="Deactivate"
        variant="danger"
      />
    </div>
  );
}
