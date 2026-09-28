import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Receipt, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  AlertCircle,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import payrollService from '../../services/payroll.service.js';

export default function ReimbursementsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-reimbursements', { status: statusFilter, search }],
    queryFn: () => payrollService.listReimbursements({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined
    })
  });

  const reimbursements = data?.reimbursements || (Array.isArray(data) ? data : []);

  const totalAmount = reimbursements.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pendingCount = reimbursements.filter(r => r.status === 'PENDING').length;
  const approvedCount = reimbursements.filter(r => r.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-teal-400" />
            Employee Expense Reimbursements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review, verify, and disburse employee travel, medical, client entertainment, and utility claims
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-teal-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Claims</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{reimbursements.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Recorded expense slips</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount Claimed</p>
          <h3 className="text-2xl font-bold text-teal-400 mt-1.5">₹{totalAmount.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-2">Across all expense categories</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1.5">{pendingCount}</h3>
          <p className="text-xs text-amber-400/80 mt-2">Awaiting verification</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved for Payout</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">{approvedCount}</h3>
          <p className="text-xs text-emerald-400/80 mt-2">Included in next payroll cycle</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search claim by description, employee or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading expense claims...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load reimbursements</h3>
            <p className="text-sm text-slate-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : reimbursements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No reimbursement claims submitted</h3>
            <p className="text-sm text-slate-500">Employee expense claims and bills will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Category / Purpose</th>
                  <th className="px-6 py-4">Claim Amount</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reimbursements.map((item) => {
                  const emp = item.employee || {};
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{emp.firstName || ''} {emp.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{emp.employeeCode || 'EMP'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">{item.category || 'Travel & Transport'}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{item.description || 'Client site commute'}</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-teal-400">
                        ₹{Number(item.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {item.status || 'PENDING'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-medium text-teal-400 hover:text-teal-300 hover:underline">
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
