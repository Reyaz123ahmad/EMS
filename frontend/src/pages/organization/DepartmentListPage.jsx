import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartments, useCreateDepartment, useDeleteDepartment } from '../../hooks/useOrganization.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export function DepartmentListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  const { data, isLoading } = useDepartments({ search });
  const createMutation = useCreateDepartment();
  const deleteMutation = useDeleteDepartment();

  const departments = data?.data?.departments || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    try {
      await deleteMutation.mutateAsync(deptToDelete.id);
      setDeptToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Department',
      key: 'name',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
            {r.name}
          </div>
          <div className="text-xs text-slate-400 font-mono">{r.departmentCode || r.code || 'MIND-DEPT-0001'}</div>
        </div>
      )
    },
    {
      header: 'Description',
      key: 'desc',
      render: (r) => (
        <span className="text-xs text-slate-300">
          {r.description || 'No description provided'}
        </span>
      )
    },
    {
      header: 'Head of Dept',
      key: 'head',
      render: (r) => (
        <span className="text-xs text-slate-300">
          {r.head ? `${r.head.firstName} ${r.head.lastName}` : 'Not assigned'}
        </span>
      )
    },
    {
      header: 'Employees',
      key: 'empCount',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
          {r._count?.employees || 0} Staff
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/organization/departments/${r.id}`)}
            className="text-slate-300 hover:text-white"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeptToDelete(r)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Departments
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organize teams, departments, and managerial hierarchy across your organization.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Department
        </Button>
      </div>

      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <Input
          type="text"
          placeholder="Search departments by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/60 border-slate-800"
        />
      </Card>

      <DataTable
        columns={columns}
        data={departments}
        isLoading={isLoading}
        emptyMessage="No departments found. Click 'Add Department' to create one."
        onRowClick={(r) => navigate(`/organization/departments/${r.id}`)}
      />

      {/* Create Department Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Department"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Department Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Engineering"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ENG"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Software product and cloud infrastructure team"
              className="bg-slate-950/60 border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deptToDelete)}
        onClose={() => setDeptToDelete(null)}
        title="Delete Department"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete department <span className="font-semibold text-white">{deptToDelete?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setDeptToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DepartmentListPage;
