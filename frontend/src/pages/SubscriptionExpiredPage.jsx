import React from 'react';
import { CreditCard, AlertCircle, Check, ArrowRight, Shield } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import { useSubscription } from '../hooks/useSubscription.js';
import { formatCurrency } from '../lib/formatters.js';

export function SubscriptionExpiredPage() {
  const { plans, createOrder, isCreatingOrder } = useSubscription();

  const handleRenew = async (planId) => {
    try {
      await createOrder(planId);
      // Trigger Razorpay modal or redirect
    } catch (err) {
      console.error(err);
    }
  };

  const defaultPlans = [
    { id: '1', name: 'Basic', price: 499, description: 'Up to 50 employees with basic attendance', features: ['Face Attendance', 'Leave Tracking', 'Basic Reports'] },
    { id: '2', name: 'Pro', price: 999, popular: true, description: 'Up to 500 employees, geofencing & payroll', features: ['RFID + Geo-Fencing', 'Automated Payroll', 'Shift Rosters', 'Asset Tracking'] },
    { id: '3', name: 'Enterprise', price: 2999, description: 'Unlimited scale, biometric integration & API', features: ['All Biometrics (Finger + Face + Card)', 'Multi-Layer Verification', 'Audit Logs & SSO', 'Custom Workflows'] }
  ];

  const displayPlans = plans && plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-10">
        {/* Header Alert */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Subscription Plan Expired
          </h1>
          <p className="mx-auto max-w-xl text-sm text-slate-400">
            Your company's active subscription period has ended. Select a plan below or renew your existing tier to immediately restore full workforce access and automated services.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayPlans.map((p) => {
            const isPopular = p.popular || p.name === 'Pro';
            return (
              <div
                key={p.id || p.name}
                className={`relative flex flex-col justify-between rounded-3xl border p-8 backdrop-blur-md transition-all ${
                  isPopular
                    ? 'border-blue-500 bg-slate-900/90 shadow-2xl shadow-blue-500/15 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <Shield className={`h-5 w-5 ${isPopular ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{p.description}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {formatCurrency(p.price)}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    {(Array.isArray(p.features) ? p.features : Object.keys(p.features || {})).slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{typeof f === 'string' ? f : f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <Button
                    variant={isPopular ? 'primary' : 'secondary'}
                    size="lg"
                    className="w-full"
                    isLoading={isCreatingOrder}
                    onClick={() => handleRenew(p.id)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Renew with {p.name}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SubscriptionExpiredPage;
