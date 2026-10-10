import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans, useCreatePlan } from '../../hooks/usePlans.js';
import { useCurrentSubscription } from '../../hooks/useSubscription.js';
import useAuthStore from '../../store/auth.store.js';
import PlanCard from '../../components/subscription/PlanCard.jsx';
import PlanComparison from '../../components/subscription/PlanComparison.jsx';
import { 
  Sparkles, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  Check
} from 'lucide-react';

export function PlansPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.roles?.includes('SUPER_ADMIN');
  
  const { data: plans = [], isLoading: loadingPlans, refetch } = usePlans();
  const { data: currentSub } = useCurrentSubscription();
  const createPlanMutation = useCreatePlan();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    priceMonthly: '',
    priceYearly: '',
    features: [
      'Face Recognition Attendance',
      'Leave Management & Balances',
      'Automated Payroll & Slips'
    ],
    newFeatureText: '',
    maxEmployees: '',
    maxBranches: '1',
    maxDevices: '1',
    maxStorageGB: '10',
    securityLevel: 'standard',
    isActive: true,
    displayOrder: ''
  });

  const handleSelectPlan = (plan) => {
    if (isSuperAdmin) {
      navigate('/companies');
    } else {
      navigate('/subscription/upgrade', { state: { selectedPlan: plan } });
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slugManual ? prev.slug : generatedSlug
    }));
  };

  const handleAddFeature = () => {
    if (!formData.newFeatureText.trim()) return;
    if (formData.features.includes(formData.newFeatureText.trim())) {
      setFormData((prev) => ({ ...prev, newFeatureText: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, prev.newFeatureText.trim()],
      newFeatureText: ''
    }));
  };

  const handleRemoveFeature = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Plan Name is required');
      return;
    }
    if (formData.priceMonthly === '' || Number(formData.priceMonthly) < 0) {
      setFormError('A valid monthly price (>= 0) is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description.trim(),
      price: Number(formData.priceMonthly),
      priceMonthly: Number(formData.priceMonthly),
      priceYearly: formData.priceYearly ? Number(formData.priceYearly) : null,
      features: formData.features,
      maxEmployees: formData.maxEmployees === '' || formData.maxEmployees === '0' || Number(formData.maxEmployees) === -1 ? -1 : Number(formData.maxEmployees),
      maxBranches: formData.maxBranches === '' || formData.maxBranches === '0' || Number(formData.maxBranches) === -1 ? -1 : Number(formData.maxBranches),
      maxDevices: formData.maxDevices === '' || formData.maxDevices === '0' || Number(formData.maxDevices) === -1 ? -1 : Number(formData.maxDevices),
      maxStorageGB: formData.maxStorageGB ? Number(formData.maxStorageGB) : 10,
      securityLevel: formData.securityLevel,
      isActive: Boolean(formData.isActive),
      displayOrder: formData.displayOrder ? Number(formData.displayOrder) : 0
    };

    createPlanMutation.mutate(payload, {
      onSuccess: (data) => {
        setIsModalOpen(false);
        setSuccessToast(`Plan "${formData.name}" created successfully!`);
        setTimeout(() => setSuccessToast(''), 4000);
        setFormData({
          name: '',
          slug: '',
          description: '',
          priceMonthly: '',
          priceYearly: '',
          features: [
            'Face Recognition Attendance',
            'Leave Management & Balances',
            'Automated Payroll & Slips'
          ],
          newFeatureText: '',
          maxEmployees: '',
          maxBranches: '1',
          maxDevices: '1',
          maxStorageGB: '10',
          securityLevel: 'standard',
          isActive: true,
          displayOrder: ''
        });
        refetch();
      },
      onError: (err) => {
        setFormError(err.response?.data?.message || err.message || 'Failed to create plan');
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4 sm:px-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Header with Title and Create Plan Button for Super Admin */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> Flexible SaaS Plans for Enterprise Growth
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isSuperAdmin ? 'Platform Subscription Tiers' : 'Choose the Perfect Plan for Your Team'}
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl">
            {isSuperAdmin
              ? 'Configure, create, and manage SaaS subscription tiers across all tenant companies.'
              : 'Scale your attendance tracking, biometric security, and HR payroll effortlessly with enterprise-grade cloud reliability.'}
          </p>
        </div>

        {isSuperAdmin && (
          <div className="shrink-0">
            <button
              id="create-plan-button"
              type="button"
              onClick={() => {
                setFormError('');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      {loadingPlans ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={!isSuperAdmin && currentSub?.planId === plan.id}
              isPopular={plan.name?.toLowerCase().includes('pro')}
              onSelect={handleSelectPlan}
              actionText={
                isSuperAdmin
                  ? 'Assign to Company'
                  : currentSub?.planId === plan.id
                  ? 'Current Plan'
                  : 'Select Plan'
              }
            />
          ))}
        </div>
      )}

      {/* Feature Comparison Matrix */}
      <div className="space-y-4 pt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          Compare All Features
        </h2>
        <PlanComparison plans={plans} />
      </div>

      {/* Modal: Create Subscription Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Create New Subscription Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Define pricing, quotas, and feature entitlements for tenant organizations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Plan Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Plan Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Growth, Enterprise Plus"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Plan Slug / Key
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. growth-tier"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase(), slugManual: true })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Plan Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of target customers and benefits..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              {/* Pricing Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Monthly Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="1499"
                      value={formData.priceMonthly}
                      onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Yearly Price (₹) <span className="text-slate-400 text-[10px] lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="14990"
                      value={formData.priceYearly}
                      onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Limits Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Employees
                  </label>
                  <input
                    type="number"
                    placeholder="0 / blank = unlimited"
                    value={formData.maxEmployees}
                    onChange={(e) => setFormData({ ...formData, maxEmployees: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">0 or blank = unlimited</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Branches
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.maxBranches}
                    onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">0 or blank = unlimited</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Devices
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.maxDevices}
                    onChange={(e) => setFormData({ ...formData, maxDevices: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">0 or blank = unlimited</span>
                </div>
              </div>

              {/* Dynamic Feature List */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Features & Inclusions
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Real-Time Geofence Spoof Protection"
                    value={formData.newFeatureText}
                    onChange={(e) => setFormData({ ...formData, newFeatureText: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Add
                  </button>
                </div>

                {/* Features tags */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
                  {formData.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                    >
                      <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      {feat}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-0.5 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status and Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 items-center">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                  <label htmlFor="isActiveToggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Plan is Active & Visible
                  </label>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Display Order:
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm text-center"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {createPlanMutation.isPending && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlansPage;
