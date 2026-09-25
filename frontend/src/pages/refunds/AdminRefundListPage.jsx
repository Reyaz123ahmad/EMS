import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllRefunds, useRefundStats } from '../../hooks/useRefunds.js';
import RefundCard from '../../components/refunds/RefundCard.jsx';
import { Plus, Search, RotateCcw, ShieldCheck, Zap, IndianRupee } from 'lucide-react';

export function AdminRefundListPage() {
  const [filters, setFilters] = useState({
    status: '',
    refundType: '',
    search: ''
  });

  const { data, isLoading } = useAllRefunds(filters);
  const { data: stats } = useRefundStats();

  const refunds = data?.refunds || [];

  const handleClearFilters = () => {
    setFilters({ status: '', refundType: '', search: '' });
  };

  const hasActiveFilters = Boolean(filters.status || filters.refundType || filters.search);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 font-bold border border-purple-200 dark:border-purple-800">
              Super Admin Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Platform Refund Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review incoming refund tickets, authorize payouts, or issue system-level compensation.
          </p>
        </div>

        <Link
          to="/admin/refunds/system-issue"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Zap className="w-4 h-4" /> Issue System Refund
        </Link>
      </div>

      {/* Admin Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">All Refund Inquiries</span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalCount || refunds.length}
          </h3>
          <span className="text-xs text-slate-400">All tenant companies</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Review Queue</span>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats?.pendingCount || refunds.filter((r) => r.status === 'PENDING').length}
          </h3>
          <span className="text-xs text-slate-400">Action required</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Approved (Ready to Dispatch)</span>
          <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats?.approvedCount || refunds.filter((r) => r.status === 'APPROVED').length}
          </h3>
          <span className="text-xs text-slate-400">Razorpay ready</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Settled Volume</span>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {Number(stats?.totalRefundedAmount || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-xs text-slate-400">Platform-wide refunds</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search reason, ID, or company..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved (Awaiting Gateway)</option>
            <option value="PROCESSED">Processed & Settled</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={filters.refundType}
            onChange={(e) => setFilters({ ...filters, refundType: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">All Refund Types</option>
            <option value="CUSTOMER_REQUEST">Customer Request</option>
            <option value="SYSTEM_ISSUE">System Outage / Incident</option>
            <option value="ADMIN_INITIATED">Admin Initiated</option>
            <option value="DUPLICATE_PAYMENT">Duplicate Charge</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">Active filters:</span>
            {filters.status && (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-medium">
                Status: {filters.status}
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Refunds Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading all tenant refund requests...</div>
      ) : refunds.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Queue is clear</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            There are no refund tickets requiring attention at this moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {refunds.map((refund) => (
            <RefundCard key={refund.id} refund={refund} isAdmin={true} />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminRefundListPage;
