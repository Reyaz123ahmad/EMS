import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans, useCurrentSubscription } from '../../hooks/useSubscription.js';
import useAuthStore from '../../store/auth.store.js';
import PlanCard from '../../components/subscription/PlanCard.jsx';
import PlanComparison from '../../components/subscription/PlanComparison.jsx';
import { Sparkles } from 'lucide-react';

export function PlansPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const { data: plans = [], isLoading: loadingPlans } = usePlans();
  const { data: currentSub } = useCurrentSubscription();

  const handleSelectPlan = (plan) => {
    if (isSuperAdmin) {
      navigate('/companies');
    } else {
      navigate('/subscription/upgrade', { state: { selectedPlan: plan } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4 sm:px-6">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Flexible SaaS Plans for Enterprise Growth
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isSuperAdmin ? 'Platform Subscription Tiers' : 'Choose the Perfect Plan for Your Team'}
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          {isSuperAdmin
            ? 'Manage and assign subscription tiers across all tenant companies.'
            : 'Scale your attendance tracking, biometric security, and HR payroll effortlessly with enterprise-grade cloud reliability.'}
        </p>
      </div>

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

      <div className="space-y-4 pt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          Compare All Features
        </h2>
        <PlanComparison plans={plans} />
      </div>
    </div>
  );
}

export default PlansPage;

