import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useDeleteSalaryComponent,
  useBulkUpdateSalaryStructure,
} from '../../hooks/usePayroll';
import { useAuthStore } from '../../store/authStore';

export default function SalaryStructurePage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const { data: componentsData, isLoading, refetch } = useSalaryComponents(companyId);
  const createComp = useCreateSalaryComponent();
  const updateComp = useUpdateSalaryComponent();
  const deleteComp = useDeleteSalaryComponent();
  const bulkUpdate = useBulkUpdateSalaryStructure();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'EARNING',
    calculationType: 'FIXED',
    defaultAmount: 0,
    isTaxable: true,
    description: '',
  });

  const handleOpenCreate = () => {
    setEditingComp(null);
    setFormData({
      name: '',
      code: '',
      type: 'EARNING',
      calculationType: 'FIXED',
      defaultAmount: 0,
      isTaxable: true,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingComp(c);
    setFormData({
      name: c.name,
      code: c.code,
      type: c.type,
      calculationType: c.calculationType,
      defaultAmount: c.defaultAmount || 0,
      isTaxable: c.isTaxable,
      description: c.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingComp) {
      await updateComp.mutateAsync({ id: editingComp.id, data: formData });
    } else {
      await createComp.mutateAsync({ companyId, ...formData });
    }
    setIsModalOpen(false);
    refetch();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteComp.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  const components = componentsData?.data?.data || componentsData?.data || [];

  const columns = [
    {
      header: 'Component Name',
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
      header: 'Type',
      accessor: 'type',
      cell: (row) => (
        <Badge variant={row.type === 'EARNING' ? 'success' : 'danger'}>
          {row.type}
        </Badge>
      ),
    },
    {
      header: 'Calculation Mode',
      accessor: 'calculationType',
      cell: (row) => <span className="text-xs text-slate-300 font-medium">{row.calculationType}</span>,
    },
    {
      header: 'Taxable',
      accessor: 'isTaxable',
      cell: (row) => (
        <span className="text-xs text-slate-400">
          {row.isTaxable ? 'Taxable' : 'Tax Exempt'}
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
          <h1 className="text-2xl font-bold text-white">Salary Components & Rules</h1>
          <p className="text-sm text-slate-400">Configure recurring allowances, deductions, and tax rules</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Salary Component
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={components} isLoading={isLoading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingComp ? 'Edit Salary Component' : 'Create Salary Component'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Component Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. House Rent Allowance (HRA), Provident Fund (PF)"
          />
          <Input
            label="Component Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="e.g. HRA, PF, TA, DA"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Component Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EARNING">Earning / Allowance</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Calculation Type</label>
              <select
                value={formData.calculationType}
                onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="FIXED">Fixed Amount</option>
                <option value="PERCENTAGE">Percentage of Basic</option>
              </select>
            </div>
          </div>

          <Input
            label="Default Amount / Percentage"
            type="number"
            value={formData.defaultAmount}
            onChange={(e) => setFormData({ ...formData, defaultAmount: Number(e.target.value) })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Calculation guidelines or tax notes..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTaxable}
                onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
              />
              Subject to Income Tax Withholding
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={createComp.isPending || updateComp.isPending}>
              {editingComp ? 'Save Changes' : 'Create Component'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Component"
        message="Are you sure you want to delete this salary component? It will be removed from all active structures."
      />
    </div>
  );
}
