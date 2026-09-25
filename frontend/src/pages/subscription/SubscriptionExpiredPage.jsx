import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, RefreshCw, ArrowRight, LogOut, ShieldAlert } from 'lucide-react';
import useAuthStore from '../../store/auth.store.js';

export function SubscriptionExpiredPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    if (logout) await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Subscription Has Expired
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Access to HR operations, automated attendance, and biometric processing is paused for your organization.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs text-rose-700 dark:text-rose-300">
          Your company data, employee records, and biometric enrollments are preserved safely. Renew to restore full platform functionality.
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/subscription/renew')}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Renew Subscription Now
          </button>
          
          <button
            onClick={() => navigate('/subscription/plans')}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            View Available Plans
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out of account
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionExpiredPage;
