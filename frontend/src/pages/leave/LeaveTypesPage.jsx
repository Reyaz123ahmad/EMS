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
import LeaveTypeModal from '../../components/leave/LeaveTypeModal';
import leaveService from '../../services/leave.service';
import { useBulkAllocateLeaves } from '../../hooks/useLeave';
import { useAuthStore } from '../../store/authStore';

export default function LeaveTypesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Fetch leave types
  const { data: leaveTypes, isLoading, error, refetch } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => leaveService.getLeaveTypes()
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => leaveService.createLeaveType(data),
    onSuccess: (data) => {
      console.log('Created:', data);
      toast.success('Leave type created successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Create error:', error);
      toast.error(error.response?.data?.message || 'Failed to create leave type');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => leaveService.updateLeaveType(id, data),
    onSuccess: (data) => {
      console.log('Updated:', data);
      toast.success('Leave type updated successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
      setEditingType(null);
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update leave type');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => leaveService.deleteLeaveType(id),
    onSuccess: () => {
      toast.success('Leave type deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      queryClient.invalidateQueries({ queryKey: ['leave', 'types'] });
      setDeletingId(null);
      setConfirmDelete(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete leave type');
      setDeletingId(null);
    }
  });

  const bulkAllocate = useBulkAllocateLeaves();
  const [bulkData, setBulkData] = useState({
    leaveTypeId: '',
    year: new Date().getFullYear(),
    days: 12,
    employeeIds: [],
  });

  // Handle form submit
  const handleSubmit = (formData) => {
    const payload = {
      ...formData,
      companyId: companyId || formData.companyId
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleOpenCreate = () => {
    setEditingType(null);
    setShowModal(true);
  };

  const handleOpenEdit = (lt) => {
    setEditingType(lt);
    setShowModal(true);
  };

  const handleDelete = (type) => {
    setConfirmDelete(type);
  };

  const handleConfirmDelete = () => {
    if (confirmDelete?.id) {
      setDeletingId(confirmDelete.id);
      deleteMutation.mutate(confirmDelete.id);
    }
  };

  const handleBulkAllocateSubmit = async (e) => {
    e.preventDefault();
    try {
      await bulkAllocate.mutateAsync({
        companyId,
        leaveTypeId: bulkData.leaveTypeId,
        year: Number(bulkData.year),
        days: Number(bulkData.days),
        employeeIds: bulkData.employeeIds,
      });
      toast.success('Leaves allocated successfully');
      queryClient.invalidateQueries({ queryKey: ['leave', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      setIsBulkModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to allocate leaves');
    }
  };

  const types = Array.isArray(leaveTypes)
    ? leaveTypes
    : Array.isArray(leaveTypes?.types)
    ? leaveTypes.types
    : Array.isArray(leaveTypes?.data?.types)
    ? leaveTypes.data.types
    : Array.isArray(leaveTypes?.data)
    ? leaveTypes.data
    : [];

  console.log('Leave types data:', types);
  console.log('Is array:', Array.isArray(types));

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
      cell: (row) => <Badge variant="primary">{row.code || '—'}</Badge>,
    },
    {
      header: 'Days / Year',
      accessor: 'daysAllowed',
      cell: (row) => (
        <span className="text-slate-200 font-medium">
          {row.maxDaysPerYear || row.daysAllowed || 0} days
        </span>
      ),
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
          {row.carryForward ? `Yes (Max ${row.maxCarryForward || row.maxCarryForwardDays || 0}d)` : 'No'}
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
          <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
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
        <Table columns={columns} data={types} isLoading={isLoading} />
      </Card>

      {/* Add / Edit Modal */}
      <LeaveTypeModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingType(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingType}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

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
              {types.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code || 'N/A'})
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
            <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={bulkAllocate.isPending}>
              Allocate Leaves
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        isOpen={!!confirmDelete}
        onClose={() => {
          if (!deletingId) {
            setConfirmDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Leave Type"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending || !!deletingId}
      />
    </div>
  );
}
