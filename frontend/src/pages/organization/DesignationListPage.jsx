import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignations, useCreateDesignation, useDeleteDesignation } from '../../hooks/useOrganization.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export function DesignationListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [desigToDelete, setDesigToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    level: 1
  });

  const { data, isLoading } = useDesignations({ search });
  const createMutation = useCreateDesignation();
  const deleteMutation = useDeleteDesignation();

  const designations = data?.data?.designations || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        level: formData.level ? parseInt(formData.level) : 1
      });
      setIsCreateModalOpen(false);
      setFormData({ name: '', code: '', description: '', level: 1 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!desigToDelete) return;
    try {
      await deleteMutation.mutateAsync(desigToDelete.id);
      setDesigToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Designation Title',
      key: 'name',
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-100 hover:text-blue-400 transition-colors">
            {r.name}
          </div>
          <div className="text-xs text-slate-400 font-mono">{r.code || 'NO-CODE'}</div>
        </div>
      )
    },
    {
      header: 'Level / Grade',
      key: 'level',
      render: (r) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
          Level {r.level || 1}
        </span>
      )
    },
    {
      header: 'Description',
      key: 'desc',
      render: (r) => (
        <span className="text-xs text-slate-300">
          {r.description || '—'}
        </span>
      )
    },
    {
      header: 'Headcount',
      key: 'empCount',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
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
            onClick={() => navigate(`/organization/designations/${r.id}`)}
            className="text-slate-300 hover:text-white"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDesigToDelete(r)}
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
            Job Designations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage organization job roles, seniority levels, and professional titles.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Designation
        </Button>
      </div>

      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <Input
          type="text"
          placeholder="Search designations by title or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/60 border-slate-800"
        />
      </Card>

      <DataTable
        columns={columns}
        data={designations}
        isLoading={isLoading}
        emptyMessage="No job designations found. Click 'Add Designation' to define one."
        onRowClick={(r) => navigate(`/organization/designations/${r.id}`)}
      />

      {/* Create Designation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Job Designation"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Title *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Senior Software Engineer"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="SSE"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Grade Level</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Lead developer responsibilities"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
              Create Designation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(desigToDelete)}
        onClose={() => setDesigToDelete(null)}
        title="Delete Designation"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete designation <span className="font-semibold text-white">{desigToDelete?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setDesigToDelete(null)}>
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

export default DesignationListPage;
