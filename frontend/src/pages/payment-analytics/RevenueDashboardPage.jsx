import React, { useState } from 'react';
import {
  useRevenueStats,
  useMRR,
  useARR,
  useRevenueByPlan
} from '../../hooks/usePaymentAnalytics.js';
import RevenueChart from '../../components/payment-analytics/RevenueChart.jsx';
import { IndianRupee, TrendingUp, Calendar, Layers, ArrowUpRight, DollarSign } from 'lucide-react';

export function RevenueDashboardPage() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const { data: revenueStats, isLoading: loadingRevenue } = useRevenueStats(dateRange);
  const { data: mrrData } = useMRR();
  const { data: arrData } = useARR();
  const { data: planRevenue = [] } = useRevenueByPlan();

  const totalRevenue = Number(revenueStats?.totalRevenue || 0);
  const mrr = Number(mrrData?.mrr || 0);
  const arr = Number(arrData?.arr || 0);
  const monthlyData = revenueStats?.monthlyTrend || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Revenue & Financial Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time insights into Monthly Recurring Revenue, ARR, and monetization performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/10 relative overflow-hidden">
          <div className="absolute right-3 -bottom-4 opacity-15">
            <IndianRupee className="w-32 h-32" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
            Total Revenue Collected
          </span>
          <h2 className="text-3xl font-extrabold mt-2 flex items-center">
            <IndianRupee className="w-6 h-6" />
            {totalRevenue.toLocaleString('en-IN')}
          </h2>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-100">
            <TrendingUp className="w-4 h-4" />
            <span>Real-time transaction aggregate</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Monthly Recurring Revenue (MRR)
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center text-indigo-600 dark:text-indigo-400">
            <IndianRupee className="w-6 h-6" />
            {mrr.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Active recurring subscription base</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Annual Run Rate (ARR)
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center text-emerald-600 dark:text-emerald-400">
            <IndianRupee className="w-6 h-6" />
            {arr.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Annualized revenue projection</p>
        </div>
      </div>

      {/* Main Revenue Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Growth Trajectory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated monthly gross billed payments (INR)
            </p>
          </div>
        </div>
        <RevenueChart data={monthlyData} />
      </div>

      {/* Plan Revenue Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Revenue Breakdown by Tier</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planRevenue.length > 0 ? (
            planRevenue.map((p, idx) => {
              const amountVal = Number(p.amount ?? p.revenue ?? 0);
              const subscribersVal = Number(p.subscribers ?? p.subscriptionCount ?? 0);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{p.planName || 'Plan'}</span>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center">
                    <IndianRupee className="w-4 h-4" />
                    {(isNaN(amountVal) ? 0 : amountVal).toLocaleString('en-IN')}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {isNaN(subscribersVal) ? 0 : subscribersVal} active subscribers
                  </span>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-6 text-center text-xs text-slate-500">
              No active subscription tiers registered.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RevenueDashboardPage;
