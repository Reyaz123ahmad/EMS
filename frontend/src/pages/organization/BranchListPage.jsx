import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranches, useCreateBranch, useDeleteBranch } from '../../hooks/useOrganization.js';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';

export function BranchListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    latitude: '',
    longitude: '',
    radiusMeters: 100
  });

  const { data, isLoading } = useBranches({ search });
  const createMutation = useCreateBranch();
  const deleteMutation = useDeleteBranch();

  const branches = data?.data?.branches || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        radiusMeters: formData.radiusMeters ? parseInt(formData.radiusMeters) : 100
      });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        country: 'USA',
        latitude: '',
        longitude: '',
        radiusMeters: 100
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    try {
      await deleteMutation.mutateAsync(branchToDelete.id);
      setBranchToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      header: 'Branch Name',
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
      header: 'Location',
      key: 'location',
      render: (r) => (
        <div className="text-xs text-slate-300">
          <div>{r.city ? `${r.city}, ${r.state || ''}` : r.address || '—'}</div>
          <div className="text-slate-500">{r.country}</div>
        </div>
      )
    },
    {
      header: 'Geo-fence',
      key: 'geofence',
      render: (r) => (
        <div className="text-xs font-mono text-slate-400">
          {r.latitude && r.longitude ? (
            <span className="text-emerald-400">
              {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)} ({r.radiusMeters}m)
            </span>
          ) : (
            <span className="text-slate-500">Not configured</span>
          )}
        </div>
      )
    },
    {
      header: 'Employees',
      key: 'empCount',
      render: (r) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
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
            onClick={() => navigate(`/organization/branches/${r.id}`)}
            className="text-slate-300 hover:text-white"
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBranchToDelete(r)}
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
            Branch Locations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage company branches, work locations, and geo-fenced attendance boundaries.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Branch
        </Button>
      </div>

      <Card className="p-4 bg-slate-900/70 border-slate-800 backdrop-blur-md">
        <Input
          type="text"
          placeholder="Search branches by name, code, or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950/60 border-slate-800"
        />
      </Card>

      <DataTable
        columns={columns}
        data={branches}
        isLoading={isLoading}
        emptyMessage="No branches configured. Click 'Add Branch' to set up a new company location."
        onRowClick={(r) => navigate(`/organization/branches/${r.id}`)}
      />

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Company Branch"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="HQ Downtown"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Branch Code</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="BR-01"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Tech Boulevard"
              className="bg-slate-950/60 border-slate-800"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">City</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">State</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Country</label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="USA"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="37.7749"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="-122.4194"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Radius (Meters)</label>
              <Input
                type="number"
                value={formData.radiusMeters}
                onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                placeholder="100"
                className="bg-slate-950/60 border-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(branchToDelete)}
        onClose={() => setBranchToDelete(null)}
        title="Delete Branch"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete branch <span className="font-semibold text-white">{branchToDelete?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setBranchToDelete(null)}>
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

export default BranchListPage;
