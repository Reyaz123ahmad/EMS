import React from 'react';
import { usePaymentSuccessRate, usePaymentMethodStats } from '../../hooks/usePaymentAnalytics.js';
import SuccessRateChart from '../../components/payment-analytics/SuccessRateChart.jsx';
import { CheckCircle2, AlertOctagon, RefreshCw, CreditCard, ShieldCheck, Zap } from 'lucide-react';

export function PaymentSuccessPage() {
  const { data: successData } = usePaymentSuccessRate();
  const { data: methodStatsData } = usePaymentMethodStats();

  const successRate = Number(successData?.successRatePercentage ?? successData?.successRate ?? 100);
  const totalAttempts = Number(successData?.totalTransactions ?? successData?.totalPayments ?? 0);
  const failedAttempts = Number(successData?.failedTransactions ?? successData?.failedCount ?? 0);
  const dailyTrend = successData?.dailyTrend || [];
  const methods = methodStatsData?.methods || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Payment Success & Gateway Reliability
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor Razorpay transaction capture health, dunning recovery success, and auth rates.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Overall Capture Rate
          </span>
          <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {successRate}%
          </h2>
          <p className="text-xs text-slate-400 mt-2">Live transaction authorization rate</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Charge Inquiries
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalAttempts}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Across all checkout attempts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Failed / Declined Inquiries
          </span>
          <h2 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {failedAttempts}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Unsuccessful transactions</p>
        </div>
      </div>

      {/* Success Rate Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Authorization & Capture Trend</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Daily percentage of successful auto-renew and customer checkout transactions
            </p>
          </div>
        </div>
        <SuccessRateChart data={dailyTrend} />
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Payment Method Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {methods.length > 0 ? (
            methods.map((m, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{m.method}</span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{m.percentage || 0}%</h4>
                <span className="text-xs text-slate-400">{m.count || 0} transactions</span>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-slate-500">
              No payment transactions captured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
