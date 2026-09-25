import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssetCategories, useCreateAssetCategory } from '../../hooks/useAssets.js';
import { ArrowLeft, Tag, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AssetCategoriesPage() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useAssetCategories();
  const { mutateAsync: createCat, isPending: isCreating } = useCreateAssetCategory();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCat({ name: name.trim(), description });
      toast.success('Category created');
      setName('');
      setDescription('');
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <button
        onClick={() => navigate('/assets')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Tag className="h-6 w-6 text-indigo-600" />
          Asset Categories
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Organize hardware assets by classification and department type.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Category Form */}
        <form onSubmit={handleAdd} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Category</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Category Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Laptops, Peripherals"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Category remarks..."
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </form>

        {/* Categories List */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Existing Categories</h3>
          {categories.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400">
              No custom categories created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-sm"
                >
                  <Tag className="h-4 w-4 text-indigo-500" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">{cat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssetCategoriesPage;
