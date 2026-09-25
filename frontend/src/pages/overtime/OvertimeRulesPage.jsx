import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  useOvertimeRules,
  useCreateOvertimeRule,
  useUpdateOvertimeRule,
  useDeleteOvertimeRule,
} from '../../hooks/useOvertime';
import { useAuthStore } from '../../store/authStore';

export default function OvertimeRulesPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const { data: rulesData, isLoading, refetch } = useOvertimeRules(companyId);
  const createRule = useCreateOvertimeRule();
  const updateRule = useUpdateOvertimeRule();
  const deleteRule = useDeleteOvertimeRule();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    multiplier: 1.5,
    minMinutes: 30,
    maxDailyMinutes: 240,
    requiresApproval: true,
    dayType: 'WEEKDAY',
  });

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      multiplier: 1.5,
      minMinutes: 30,
      maxDailyMinutes: 240,
      requiresApproval: true,
      dayType: 'WEEKDAY',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      multiplier: rule.multiplier,
      minMinutes: rule.minMinutes,
      maxDailyMinutes: rule.maxDailyMinutes,
      requiresApproval: rule.requiresApproval,
      dayType: rule.dayType || 'WEEKDAY',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRule) {
      await updateRule.mutateAsync({ id: editingRule.id, data: formData });
    } else {
      await createRule.mutateAsync({ companyId, ...formData });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteRule.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const rules = rulesData?.data?.data || rulesData?.data || [];

  const columns = [
    {
      header: 'Rule Name',
      accessor: 'name',
      cell: (row) => <span className="font-semibold text-white">{row.name}</span>,
    },
    {
      header: 'Day Type',
      accessor: 'dayType',
      cell: (row) => <Badge variant="primary">{row.dayType || 'WEEKDAY'}</Badge>,
    },
    {
      header: 'Rate Multiplier',
      accessor: 'multiplier',
      cell: (row) => <span className="text-amber-400 font-bold">{row.multiplier}x Rate</span>,
    },
    {
      header: 'Min Duration',
      accessor: 'minMinutes',
      cell: (row) => <span className="text-slate-300">{row.minMinutes} mins</span>,
    },
    {
      header: 'Max Daily Cap',
      accessor: 'maxDailyMinutes',
      cell: (row) => <span className="text-slate-300">{row.maxDailyMinutes} mins ({(row.maxDailyMinutes / 60).toFixed(1)}h)</span>,
    },
    {
      header: 'Approval Needed',
      accessor: 'requiresApproval',
      cell: (row) => (
        <Badge variant={row.requiresApproval ? 'warning' : 'success'}>
          {row.requiresApproval ? 'Required' : 'Auto-Approved'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteId(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Overtime Compensation Policies</h1>
          <p className="text-sm text-slate-400">Configure overtime rate multipliers and shift caps</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Overtime Rule
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={rules} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRule ? 'Edit Overtime Rule' : 'Create Overtime Rule'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Rule Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Standard Weekday OT (1.5x), Weekend OT (2.0x)"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Day Category</label>
              <select
                value={formData.dayType}
                onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WEEKDAY">Regular Weekday</option>
                <option value="WEEKEND">Weekend / Off-Day</option>
                <option value="HOLIDAY">Public Holiday</option>
              </select>
            </div>
            <Input
              label="Pay Multiplier"
              type="number"
              step="0.1"
              required
              value={formData.multiplier}
              onChange={(e) => setFormData({ ...formData, multiplier: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Threshold (Minutes)"
              type="number"
              value={formData.minMinutes}
              onChange={(e) => setFormData({ ...formData, minMinutes: Number(e.target.value) })}
            />
            <Input
              label="Max Daily Cap (Minutes)"
              type="number"
              value={formData.maxDailyMinutes}
              onChange={(e) => setFormData({ ...formData, maxDailyMinutes: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              Require Manager Approval Before Payout
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createRule.isPending || updateRule.isPending}>
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Overtime Rule"
        message="Are you sure you want to delete this rule?"
      />
    </div>
  );
}
