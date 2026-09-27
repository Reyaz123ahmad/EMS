import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import overtimeService from '../../services/overtime.service.js';
import useAuthStore from '../../store/auth.store.js';

export default function OvertimeRulesPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const queryClient = useQueryClient();

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

  const { data: rawRules = [], isLoading, refetch } = useQuery({
    queryKey: ['overtime-rules', companyId],
    queryFn: () => overtimeService.getOvertimeRules(),
  });

  const rules = Array.isArray(rawRules)
    ? rawRules
    : Array.isArray(rawRules?.rules)
    ? rawRules.rules
    : Array.isArray(rawRules?.data?.rules)
    ? rawRules.data.rules
    : Array.isArray(rawRules?.data?.data)
    ? rawRules.data.data
    : Array.isArray(rawRules?.data)
    ? rawRules.data
    : [];

  const createMutation = useMutation({
    mutationFn: (data) => overtimeService.createOvertimeRule(data),
    onSuccess: () => {
      toast.success('Overtime rule created');
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
      setIsModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create rule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => overtimeService.updateOvertimeRule(id, data),
    onSuccess: () => {
      toast.success('Overtime rule updated');
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
      setIsModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update rule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => overtimeService.deleteOvertimeRule(id),
    onSuccess: () => {
      toast.success('Rule deleted');
      queryClient.invalidateQueries({ queryKey: ['overtime-rules'] });
      queryClient.invalidateQueries({ queryKey: ['overtime', 'rules'] });
      setDeleteId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete rule');
    }
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
      maxDailyMinutes: rule.maxMinutesPerDay || rule.maxDailyMinutes || 240,
      requiresApproval: rule.requiresApproval !== undefined ? rule.requiresApproval : true,
      dayType: rule.dayType || 'WEEKDAY',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate({ companyId, ...formData });
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

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
      cell: (row) => <span className="text-slate-300">{row.minMinutes || 30} mins</span>,
    },
    {
      header: 'Max Daily Cap',
      accessor: 'maxDailyMinutes',
      cell: (row) => {
        const cap = row.maxMinutesPerDay || row.maxDailyMinutes || 240;
        return <span className="text-slate-300">{cap} mins ({(cap / 60).toFixed(1)}h)</span>;
      },
    },
    {
      header: 'Approval Needed',
      accessor: 'requiresApproval',
      cell: (row) => (
        <Badge variant={row.requiresApproval === false ? 'success' : 'warning'}>
          {row.requiresApproval === false ? 'Auto-Approved' : 'Required'}
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
            <Button variant="primary" type="submit" loading={createMutation.isPending || updateMutation.isPending}>
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
