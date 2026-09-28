import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Briefcase
} from 'lucide-react';
import payrollService from '../../services/payroll.service.js';

export default function LoansAdvancesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-loans-advances', { status: statusFilter, search }],
    queryFn: () => payrollService.listLoansAdvances({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      search: search || undefined
    })
  });

  const loans = data?.loans || (Array.isArray(data) ? data : []);

  const totalDisbursed = loans.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.balance || l.amount || 0), 0);
  const activeLoansCount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-amber-400" />
            Employee Loans & Salary Advances
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage company loans, emergency salary advances, EMI deductions, and principal repayments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Loans & Advances</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{activeLoansCount}</h3>
          <p className="text-xs text-slate-500 mt-2">Currently being recovered via payroll EMI</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Principal Disbursed</p>
          <h3 className="text-2xl font-bold text-amber-400 mt-1.5">₹{totalDisbursed.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-2">Cumulative advance financial aid</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Outstanding</p>
          <h3 className="text-2xl font-bold text-rose-400 mt-1.5">₹{totalOutstanding.toLocaleString('en-IN')}</h3>
          <p className="text-xs text-slate-500 mt-2">To be recovered across future pay cycles</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee or loan reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {['ALL', 'ACTIVE', 'PAID', 'PENDING'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-amber-600 text-white shadow-sm'
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
            <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading loan records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load loans</h3>
            <p className="text-sm text-slate-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No loan records found</h3>
            <p className="text-sm text-slate-500">Employee loan agreements and salary advances will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Loan Type / Purpose</th>
                  <th className="px-6 py-4">Principal Amount</th>
                  <th className="px-6 py-4">Monthly EMI</th>
                  <th className="px-6 py-4">Outstanding Balance</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loans.map((l) => {
                  const emp = l.employee || {};
                  const isActive = l.status === 'ACTIVE' || l.status === 'APPROVED';

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-100">{emp.firstName || ''} {emp.lastName || ''}</p>
                        <p className="text-xs text-slate-400">{emp.employeeCode || 'EMP'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-200">{l.type || 'Salary Advance'}</p>
                        <p className="text-xs text-slate-400">{l.reason || 'Personal / Emergency'}</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-100">
                        ₹{Number(l.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 font-medium text-amber-400">
                        ₹{Number(l.emi || 0).toLocaleString('en-IN')}/mo
                      </td>

                      <td className="px-6 py-4 font-bold text-rose-400">
                        ₹{Number(l.balance || l.amount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {l.status || 'ACTIVE'}
                        </span>
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
