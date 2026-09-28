import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  Search, 
  RefreshCw, 
  Users, 
  Layers, 
  TrendingUp, 
  Plus, 
  Edit3, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import payrollService from '../../services/payroll.service.js';

export default function SalaryStructuresPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payroll-salary-structures', { page, search }],
    queryFn: () => payrollService.listSalaryStructures({
      page,
      search: search || undefined
    })
  });

  const structures = data?.structures || (Array.isArray(data) ? data : []);
  const total = data?.total || structures.length;

  const totalBaseCTC = structures.reduce((sum, s) => sum + Number(s.ctc || 0), 0);
  const avgCTC = structures.length > 0 ? Math.round(totalBaseCTC / structures.length) : 0;

  const filteredStructures = structures.filter(s => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = `${s.employee?.firstName || ''} ${s.employee?.lastName || ''}`.toLowerCase();
    const code = (s.employee?.employeeCode || '').toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Salary Structures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure employee compensation packages, CTC distributions, and salary components
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Structures</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{total}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Configured employee packages</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Annual CTC</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1.5">₹{avgCTC.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Mean package across active workforce</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Annualized Payroll</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1.5">₹{totalBaseCTC.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Aggregated base commitments</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee salary structure by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Loading salary structures...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load salary structures</h3>
            <p className="text-sm text-slate-400">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredStructures.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No salary structures configured</h3>
            <p className="text-sm text-slate-500">Employee salary breakdown records will appear here once defined.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department / Designation</th>
                  <th className="px-6 py-4">Annual CTC</th>
                  <th className="px-6 py-4">Monthly Gross</th>
                  <th className="px-6 py-4">Component Breakdown</th>
                  <th className="px-6 py-4 text-right">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStructures.map((st) => {
                  const emp = st.employee || {};
                  const ctc = Number(st.ctc || 0);
                  const monthly = Math.round(ctc / 12);
                  const components = st.components || [];

                  return (
                    <tr key={st.id || emp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center justify-center">
                            {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{emp.firstName || ''} {emp.lastName || ''}</p>
                            <p className="text-xs text-slate-400">{emp.employeeCode || 'EMP'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-200">{emp.department?.name || 'General'}</p>
                        <p className="text-xs text-slate-400">{emp.designation?.name || 'Staff'}</p>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-100">
                        ₹{ctc.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4 font-medium text-emerald-400">
                        ₹{monthly.toLocaleString('en-IN')}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {components.length > 0 ? (
                            components.map((c, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300"
                              >
                                <span className="text-emerald-400">{c.component?.name || 'Component'}:</span> ₹{Number(c.amount || 0).toLocaleString('en-IN')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">Standard base components</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right text-xs text-slate-400">
                        {st.effectiveFrom ? new Date(st.effectiveFrom).toLocaleDateString() : 'Active'}
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
