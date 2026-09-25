import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
  useBulkAllocateLeaves,
} from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';

export default function LeaveTypesPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const { data: typesData, isLoading, refetch } = useLeaveTypes(companyId);
  const createType = useCreateLeaveType();
  const updateType = useUpdateLeaveType();
  const deleteType = useDeleteLeaveType();
  const bulkAllocate = useBulkAllocateLeaves();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    daysAllowed: 12,
    isPaid: true,
    carryForward: false,
    maxCarryForwardDays: 0,
  });

  const [bulkData, setBulkData] = useState({
    leaveTypeId: '',
    year: new Date().getFullYear(),
    days: 12,
    employeeIds: [],
  });

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      daysAllowed: 12,
      isPaid: true,
      carryForward: false,
      maxCarryForwardDays: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lt) => {
    setEditingType(lt);
    setFormData({
      name: lt.name,
      code: lt.code,
      description: lt.description || '',
      daysAllowed: lt.daysAllowed,
      isPaid: lt.isPaid,
      carryForward: lt.carryForward,
      maxCarryForwardDays: lt.maxCarryForwardDays || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingType) {
      await updateType.mutateAsync({ id: editingType.id, data: formData });
    } else {
      await createType.mutateAsync({ companyId, ...formData });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteType.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const handleBulkAllocateSubmit = async (e) => {
    e.preventDefault();
    await bulkAllocate.mutateAsync({
      companyId,
      leaveTypeId: bulkData.leaveTypeId,
      year: Number(bulkData.year),
      days: Number(bulkData.days),
      employeeIds: bulkData.employeeIds,
    });
    setIsBulkModalOpen(false);
  };

  const leaveTypes = typesData?.data?.data || typesData?.data || [];

  const columns = [
    {
      header: 'Leave Type',
      accessor: 'name',
      cell: (row) => (
        <div>
          <div className="font-semibold text-white">{row.name}</div>
          <div className="text-xs text-slate-400">{row.description || 'No description'}</div>
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      cell: (row) => <Badge variant="primary">{row.code}</Badge>,
    },
    {
      header: 'Days / Year',
      accessor: 'daysAllowed',
      cell: (row) => <span className="text-slate-200 font-medium">{row.daysAllowed} days</span>,
    },
    {
      header: 'Type',
      accessor: 'isPaid',
      cell: (row) => (
        <Badge variant={row.isPaid ? 'success' : 'warning'}>
          {row.isPaid ? 'Paid' : 'Unpaid'}
        </Badge>
      ),
    },
    {
      header: 'Carry Forward',
      accessor: 'carryForward',
      cell: (row) => (
        <span className="text-xs text-slate-300">
          {row.carryForward ? `Yes (Max ${row.maxCarryForwardDays || 0}d)` : 'No'}
        </span>
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
          <h1 className="text-2xl font-bold text-white">Leave Types & Configuration</h1>
          <p className="text-sm text-slate-400">Configure company leave policies and entitlements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)}>
            Bulk Allocate
          </Button>
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Leave Type
          </Button>
        </div>
      </div>

      <Card>
        <Table columns={columns} data={leaveTypes} isLoading={isLoading} />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? 'Edit Leave Type' : 'Create Leave Type'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Type Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Annual Leave, Casual Leave"
          />
          <Input
            label="Leave Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. AL, CL, SL"
          />
          <Input
            label="Annual Allowance (Days)"
            type="number"
            required
            value={formData.daysAllowed}
            onChange={(e) => setFormData({ ...formData, daysAllowed: Number(e.target.value) })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Brief description of when this applies..."
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              Paid Leave
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.carryForward}
                onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              Allow Carry Forward
            </label>
          </div>
          {formData.carryForward && (
            <Input
              label="Max Carry Forward Days"
              type="number"
              value={formData.maxCarryForwardDays}
              onChange={(e) => setFormData({ ...formData, maxCarryForwardDays: Number(e.target.value) })}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createType.isPending || updateType.isPending}>
              {editingType ? 'Save Changes' : 'Create Type'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Allocate Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Allocate Leaves"
      >
        <form onSubmit={handleBulkAllocateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Leave Type</label>
            <select
              required
              value={bulkData.leaveTypeId}
              onChange={(e) => setBulkData({ ...bulkData, leaveTypeId: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Leave Type --</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Allocation Year"
            type="number"
            required
            value={bulkData.year}
            onChange={(e) => setBulkData({ ...bulkData, year: Number(e.target.value) })}
          />
          <Input
            label="Total Days Granted"
            type="number"
            required
            value={bulkData.days}
            onChange={(e) => setBulkData({ ...bulkData, days: Number(e.target.value) })}
          />
          <p className="text-xs text-slate-400">
            Note: Leaving employee selection blank will automatically grant this balance to all active employees in the company.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={bulkAllocate.isPending}>
              Allocate Leaves
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Leave Type"
        message="Are you sure you want to delete this leave type? This action cannot be undone."
      />
    </div>
  );
}
