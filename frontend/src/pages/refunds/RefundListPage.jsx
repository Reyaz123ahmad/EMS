import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRefunds, useRefundStats } from '../../hooks/useRefunds.js';
import RefundCard from '../../components/refunds/RefundCard.jsx';
import { Plus, Search, Filter, RotateCcw, X, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';

export function RefundListPage() {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const { data, isLoading } = useRefunds(filters);
  const { data: stats } = useRefundStats();

  const refunds = data?.refunds || [];

  const handleClearFilters = () => {
    setFilters({ status: '', search: '', startDate: '', endDate: '' });
  };

  const hasActiveFilters = Boolean(filters.status || filters.search || filters.startDate || filters.endDate);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Refunds</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage your subscription refund requests and settlement statuses.
          </p>
        </div>
        <Link
          to="/refunds/request"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Request Refund
        </Link>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Requested</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {stats?.totalCount || refunds.length}
          </h3>
          <span className="text-xs text-slate-400">Across all billing cycles</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Review</span>
          <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats?.pendingCount || refunds.filter((r) => r.status === 'PENDING').length}
          </h3>
          <span className="text-xs text-slate-400">Under admin assessment</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Settled</span>
          <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
            <IndianRupee className="w-4 h-4" />
            {Number(stats?.totalRefundedAmount || 0).toLocaleString('en-IN')}
          </h3>
          <span className="text-xs text-slate-400">Processed refunds</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Rejected Requests</span>
          <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stats?.rejectedCount || refunds.filter((r) => r.status === 'REJECTED').length}
          </h3>
          <span className="text-xs text-slate-400">Policy ineligibility</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reason or ID..."
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
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSED">Processed</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium">
                Status: {filters.status}
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium">
                Search: {filters.search}
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Refunds List Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading refund requests...</div>
      ) : refunds.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <RotateCcw className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No refunds found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You have not requested any refunds yet or no records matched your filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {refunds.map((refund) => (
            <RefundCard key={refund.id} refund={refund} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RefundListPage;
