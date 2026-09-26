import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCurrentSubscription, useSubscriptionStats, useCheckExpiry, useCancelSubscription } from '../../hooks/useSubscription.js';
import useAuthStore from '../../store/auth.store.js';
import UsageCard from '../../components/subscription/UsageCard.jsx';
import { Users, Building2, Smartphone, ShieldCheck, RefreshCw, AlertCircle, ArrowUpRight, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export function CurrentSubscriptionPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { data: sub, isLoading: loadingSub } = useCurrentSubscription();
  const { data: stats } = useSubscriptionStats();
  const { data: expiry } = useCheckExpiry();
  const { mutateAsync: cancelSub, isPending: cancelling } = useCancelSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    try {
      await cancelSub(cancelReason || 'Requested by admin');
      toast.success('Subscription auto-renew cancelled');
      setShowCancelModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel subscription');
    }
  };

  const plan = sub?.plan || { name: 'Pro Enterprise', maxEmployees: 500, maxBranches: 5, maxDevices: 10 };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {isSuperAdmin ? 'Subscription Management' : 'Current Subscription'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isSuperAdmin
              ? 'Platform Super Admin view. Configure tiers and assign subscriptions to organizations.'
              : "Manage your company's tier, usage limits, and renewal options."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin ? (
            <>
              <Link
                to="/plans"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <Edit3 className="h-4 w-4" /> Edit Platform Plans
              </Link>
              <Link
                to="/companies"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Assign Plan to Company <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/subscription/plans"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Change Plan <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => navigate('/subscription/renew')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Renew Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" /> {sub?.status || 'ACTIVE'}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {plan.name} Plan
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              {plan.description || 'Full platform features with active attendance, payroll and biometric sync.'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              ₹{Number(plan.price || 0).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Billed {sub?.plan?.billingCycle || 'monthly'}
            </span>
            <span className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              {expiry?.daysRemaining !== undefined ? `${expiry.daysRemaining} days remaining` : 'Active'}
            </span>
          </div>
        </div>

        {/* Usage Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <UsageCard
            title="Total Employees"
            current={stats?.totalEmployees || 12}
            max={plan.maxEmployees}
            icon={Users}
            color="indigo"
          />
          <UsageCard
            title="Active Branches"
            current={stats?.totalBranches || 1}
            max={plan.maxBranches}
            icon={Building2}
            color="emerald"
          />
          <UsageCard
            title="Biometric Devices"
            current={stats?.totalDevices || 2}
            max={plan.maxDevices}
            icon={Smartphone}
            color="purple"
          />
        </div>
      </div>

      {/* Subscription Actions */}
      {!isSuperAdmin && (
        <div className="flex items-center justify-between p-5 rounded-2xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/20 dark:bg-rose-950/10">
          <div>
            <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-300">
              Cancel Subscription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Auto-renew will be paused at the end of the current billing cycle.
            </p>
          </div>
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            Cancel Auto-Renew
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Subscription</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Please tell us why you are cancelling your subscription:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Your feedback helps us improve..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrentSubscriptionPage;
