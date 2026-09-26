import React from 'react';
import { useChurnRate } from '../../hooks/usePaymentAnalytics.js';
import ChurnChart from '../../components/payment-analytics/ChurnChart.jsx';
import { UserMinus, AlertTriangle, ShieldCheck, HeartHandshake, TrendingDown } from 'lucide-react';

export function ChurnAnalysisPage() {
  const { data, isLoading } = useChurnRate();

  const churnRate = Number(data?.churnRatePercentage ?? data?.churnRate ?? 0);
  const churnedCount = Number(data?.churnedSubscriptions ?? data?.churnedTotal ?? 0);
  const totalSubscriptions = Number(data?.totalSubscriptions ?? 0);
  const retentionRate = totalSubscriptions > 0 ? (100 - churnRate).toFixed(1) : '100.0';
  const monthlyTrend = data?.monthlyTrend || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Subscriber Retention & Churn Analysis
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor cancellation rates, analyze customer drop-off causes, and optimize tenant retention.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Current Churn Rate
          </span>
          <h2 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-2">
            <span>{churnRate}%</span>
          </h2>
          <p className="text-xs text-slate-400 mt-2">Calculated from subscription lifecycle</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Platform Retention Rate
          </span>
          <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {retentionRate}%
          </h2>
          <p className="text-xs text-slate-400 mt-2">Active vs churned tenant ratio</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Cancellations (Period)
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {churnedCount} accounts
          </h2>
          <p className="text-xs text-slate-400 mt-2">Out of {totalSubscriptions} total subscriptions</p>
        </div>
      </div>

      {/* Churn Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Churn Trend (%)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Percentage of paying subscribers who cancelled their recurring subscription
            </p>
          </div>
        </div>
        <ChurnChart data={monthlyTrend} />
      </div>
    </div>
  );
}

export default ChurnAnalysisPage;
