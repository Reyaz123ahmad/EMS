import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentSubscription, usePlans, useRenewSubscription, useVerifyPayment } from '../../hooks/useSubscription.js';
import { RefreshCw, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function RenewSubscriptionPage() {
  const navigate = useNavigate();
  const { data: currentSub } = useCurrentSubscription();
  const { data: plans = [] } = usePlans();
  const { mutateAsync: renewSub, isPending: renewing } = useRenewSubscription();
  const { mutateAsync: verifyPayment, isPending: verifying } = useVerifyPayment();

  const [selectedPlanId, setSelectedPlanId] = useState(currentSub?.planId || plans[0]?.id || '');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleRenew = async () => {
    if (!selectedPlan) return;
    try {
      toast.loading('Processing renewal payment...');
      await renewSub({
        planId: selectedPlan.id,
        billingCycle,
      });

      // Verification mock
      await verifyPayment({
        razorpayOrderId: `order_renew_${Date.now()}`,
        razorpayPaymentId: `pay_renew_${Date.now()}`,
        razorpaySignature: `sig_renew_${Date.now()}`,
        planId: selectedPlan.id,
        billingCycle,
      });

      toast.dismiss();
      toast.success('Subscription renewed successfully!');
      navigate('/subscription/current');
    } catch (err) {
      toast.dismiss();
      toast.error(err.message || 'Renewal failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
          <RefreshCw className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Renew Your Subscription
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Keep your company biometric punches, automatic attendance, and payroll engine running without interruptions.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Plans */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-900 dark:text-white">
            Select Renewal Tier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = (selectedPlan?.id || plans[0]?.id) === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{p.name}</h4>
                  <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
                    ₹{Number(p.price).toLocaleString()}
                  </p>
                  <span className="text-xs text-slate-400">per month</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cycle selector */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Billing Term
            </span>
            <p className="text-xs text-slate-400">Select annual billing for 2 months free</p>
          </div>
          <select
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium"
          >
            <option value="monthly">Monthly (₹{Number(selectedPlan?.price || 0).toLocaleString()}/mo)</option>
            <option value="yearly">Yearly (₹{Number((selectedPlan?.price || 0) * 10).toLocaleString()}/yr)</option>
          </select>
        </div>

        <button
          onClick={handleRenew}
          disabled={renewing || verifying}
          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-5 w-5" />
          {renewing || verifying ? 'Renewing...' : 'Confirm & Renew Subscription'}
        </button>
      </div>
    </div>
  );
}

export default RenewSubscriptionPage;
