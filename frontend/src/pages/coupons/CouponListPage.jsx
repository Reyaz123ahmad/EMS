import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCoupons, useCreateCoupon, useDeleteCoupon, useCouponStats } from '../../hooks/useCoupons.js';
import { Tag, Plus, Search, Trash2, Calendar, Percent, IndianRupee, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function CouponListPage() {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    maxUses: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  const { data, isLoading } = useCoupons(filters);
  const { data: stats } = useCouponStats();
  const { mutateAsync: createCoupon, isPending: creating } = useCreateCoupon();
  const { mutateAsync: deleteCoupon } = useDeleteCoupon();

  const coupons = data?.coupons || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.discountValue) {
      toast.error('Please enter coupon code and discount value');
      return;
    }
    try {
      await createCoupon({
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: Number(formData.discountValue),
        maxUses: Number(formData.maxUses || 100)
      });
      setShowCreateModal(false);
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        maxUses: 100,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
    } catch (err) {
      // toast in hook
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this coupon?')) {
      await deleteCoupon(id);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
              Super Admin Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Coupons & Promotional Discounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and distribute discount vouchers for subscription upgrades and tenant renewals.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupon Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <Tag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No promotional coupons found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Click "Create Coupon" to configure discount vouchers for onboarding and renewals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm">
                    {c.code}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      c.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  {c.discountType === 'PERCENTAGE' ? (
                    <>
                      <span>{c.discountValue}% OFF</span>
                    </>
                  ) : (
                    <>
                      <IndianRupee className="w-5 h-5" />
                      <span>{Number(c.discountValue).toLocaleString('en-IN')} OFF</span>
                    </>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Valid: {new Date(c.validFrom).toLocaleDateString()} - {new Date(c.validTo).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    Uses: <span className="font-semibold text-slate-800 dark:text-slate-200">{c.usedCount || 0}</span> / {c.maxUses || 'Unlimited'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Link
                  to={`/coupons/${c.id}`}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Coupon</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Coupon Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUMMER25"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="w-full uppercase font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="25"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valid To
                  </label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Redemption Uses
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CouponListPage;
