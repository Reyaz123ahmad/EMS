import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Calendar, 
  RefreshCw, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import payrollService from '../../services/payroll.service.js';

export default function PayrollAnalyticsPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-analytics'],
    queryFn: () => payrollService.getPayrollAnalytics()
  });

  const overview = data?.overview || {
    totalDisbursed: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalRuns: 0
  };

  const monthlyTrends = data?.monthlyTrends || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-indigo-400" />
            Payroll Financial Analytics & Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Executive overview of salary disbursements, statutory tax deductions, and historical payroll trends
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Aggregating payroll financial analytics...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">Unable to load payroll analytics</h3>
          <p className="text-sm text-slate-400">{error.message}</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Net Disbursed</p>
                  <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">₹{(overview.totalDisbursed || 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Transferred to employee accounts</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Gross Payroll</p>
                  <h3 className="text-2xl font-bold text-slate-100 mt-1.5">₹{(overview.totalGross || 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Gross compensation earned</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statutory Deductions</p>
                  <h3 className="text-2xl font-bold text-amber-400 mt-1.5">₹{(overview.totalDeductions || 0).toLocaleString('en-IN')}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">PF, ESI, TDS & loan EMIs</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payroll Batches Processed</p>
                  <h3 className="text-2xl font-bold text-sky-400 mt-1.5">{overview.totalRuns || monthlyTrends.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <FileCheck className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Successful disbursement runs</p>
            </div>
          </div>

          {/* Monthly Trend Visual Breakdown */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Monthly Payroll Run History & Disbursement Dynamics
            </h3>

            {monthlyTrends.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No closed payroll cycles found. Process a payroll run to populate trend statistics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Pay Period</th>
                      <th className="px-6 py-4">Employees</th>
                      <th className="px-6 py-4">Gross Compensation</th>
                      <th className="px-6 py-4">Deductions</th>
                      <th className="px-6 py-4">Net Payout</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {monthlyTrends.map((trend, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-100">
                          {trend.period || `${trend.month}/${trend.year}`}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {trend.employees || 0} active
                        </td>
                        <td className="px-6 py-4 text-slate-200">
                          ₹{Number(trend.gross || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-medium text-amber-400">
                          ₹{Number(trend.deductions || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-400">
                          ₹{Number(trend.net || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {trend.status || 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
