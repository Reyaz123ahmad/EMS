import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAsset, useAssetCategories } from '../../hooks/useAssets.js';
import { ArrowLeft, Laptop, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CreateAssetPage() {
  const navigate = useNavigate();
  const { data: rawCategories = [] } = useAssetCategories();
  const categories = Array.isArray(rawCategories) ? rawCategories : [];
  const { mutateAsync: createAsset, isPending: isCreating } = useCreateAsset();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Laptops',
    purchasePrice: '',
    condition: 'NEW',
    description: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAsset({
        ...formData,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
      });
      toast.success('Asset created successfully');
      navigate('/assets');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create asset');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Laptop className="h-6 w-6 text-indigo-600" />
          Create New Asset
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Register a physical device or company property in inventory.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Asset Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Dell Latitude 7420"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Asset Tag / Serial Code *</label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. LAP-DL-0042"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Category *</label>
            <select
              value={formData.category}
              required
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs font-medium"
            >
              {categories.map((cat, idx) => {
                const val = typeof cat === 'object' ? cat.name || cat.category : cat;
                return (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Purchase Price (₹)</label>
          <input
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            placeholder="e.g. 85000"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Description / Specs</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="16GB RAM, 512GB SSD, Intel i7..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
        >
          {isCreating ? 'Registering Asset...' : 'Save & Register Asset'}
        </button>
      </form>
    </div>
  );
}

export default CreateAssetPage;
