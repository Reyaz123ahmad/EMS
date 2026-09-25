import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAssets, useAssetStats, useCreateAsset, useBulkImportAssets } from '../../hooks/useAssets.js';
import AssetCard from '../../components/assets/AssetCard.jsx';
import { Laptop, Plus, Upload, Download, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

export function AssetListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: assets = [], isLoading } = useAssets({
    search,
    category: categoryFilter,
  });
  const { data: stats } = useAssetStats();
  const { mutateAsync: createAsset, isPending: isCreating } = useCreateAsset();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Electronics',
    purchasePrice: '',
    condition: 'NEW',
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAsset({
        ...formData,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
      });
      toast.success('Asset added successfully');
      setShowAddModal(false);
      setFormData({ name: '', code: '', category: 'Electronics', purchasePrice: '', condition: 'NEW' });
    } catch (err) {
      toast.error(err.message || 'Failed to create asset');
    }
  };

  const handleExport = () => {
    toast.success('Exporting asset register...');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Asset Inventory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track company hardware, workstations, peripherals, and assignment life-cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/assets/categories"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Categories
          </Link>
          <button
            onClick={handleExport}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Total Assets</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.totalAssets || 0}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Assigned</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats?.assignedAssets || 0}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Available</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.availableAssets || 0}</p>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-xs font-medium text-slate-400">Active</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.activeAssets || 0}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by asset name or asset code..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Laptop className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Assets Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add physical laptops, monitors, or phones to start tracking custody.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Asset</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Asset Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="MacBook Pro M3 16"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Asset Tag / Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="LAP-MBP-001"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Electronics"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
                  >
                    <option value="NEW">New</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Purchase Price (₹)</label>
                <input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="150000"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isCreating ? 'Saving...' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetListPage;
