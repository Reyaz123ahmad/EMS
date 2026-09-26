import React from 'react';
import { useRefundRate, useRevenueStats } from '../../hooks/usePaymentAnalytics.js';
import RefundChart from '../../components/payment-analytics/RefundChart.jsx';
import { RotateCcw, ShieldAlert, IndianRupee, PieChart, CheckCircle2 } from 'lucide-react';

export function RefundAnalyticsPage() {
  const { data: refundData } = useRefundRate();

  const refundRate = Number(refundData?.refundRate || 0);
  const totalRefundAmount = Number(refundData?.totalRefundedAmount || 0);
  const totalRefundCount = Number(refundData?.totalRefundCount || 0);
  const reasons = refundData?.reasons || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Refund & Dispute Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Deep-dive into payout clawbacks, refund volume, and customer dissatisfaction drivers.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Overall Refund Rate
          </span>
          <h2 className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {refundRate}%
          </h2>
          <p className="text-xs text-slate-400 mt-2">Processed vs requested ratio</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Settled Refunds
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center">
            <IndianRupee className="w-6 h-6 text-emerald-600" />
            {totalRefundAmount.toLocaleString('en-IN')}
          </h2>
          <p className="text-xs text-slate-400 mt-2">Across {totalRefundCount} authorized tickets</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Settlement Processing
          </span>
          <h2 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {refundData?.processedCount || 0} Processed
          </h2>
          <p className="text-xs text-slate-400 mt-2">Out of {totalRefundCount} total tickets</p>
        </div>
      </div>

      {/* Root Cause Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Refund Volume by Cause</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Breakdown of customer claims and system compensation triggers
            </p>
          </div>
        </div>
        <RefundChart data={reasons} />
      </div>
    </div>
  );
}

export default RefundAnalyticsPage;
