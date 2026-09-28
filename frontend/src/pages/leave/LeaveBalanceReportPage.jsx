import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import leaveService from '../../services/leave.service.js';

export default function LeaveBalanceReportPage() {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDepartment, setSelectedDepartment] = useState('');

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['leave-balance-report', { search, year: selectedYear, departmentId: selectedDepartment }],
    queryFn: () => leaveService.getBalanceReport({
      search: search || undefined,
      year: selectedYear,
      departmentId: selectedDepartment || undefined
    })
  });

  const reportData = data?.report || (Array.isArray(data) ? data : []);
  const leaveTypes = data?.leaveTypes || [];

  // Summary Metrics
  const totalEmployees = reportData.length;
  const totalAllocatedDays = reportData.reduce((acc, row) => acc + (row.totalAllowed || 0), 0);
  const totalUsedDays = reportData.reduce((acc, row) => acc + (row.totalUsed || 0), 0);
  const totalRemainingDays = reportData.reduce((acc, row) => acc + (row.totalRemaining || 0), 0);
  const utilizationRate = totalAllocatedDays > 0 ? Math.round((totalUsedDays / totalAllocatedDays) * 100) : 0;

  const handleExportCSV = () => {
    if (!reportData.length) return;
    const headers = ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Total Allowed', 'Total Used', 'Total Remaining'];
    const csvRows = [headers.join(',')];

    reportData.forEach((row) => {
      const emp = row.employee || {};
      const values = [
        `"${emp.employeeCode || ''}"`,
        `"${emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}"`,
        `"${emp.department || 'N/A'}"`,
        `"${emp.designation || 'N/A'}"`,
        row.totalAllowed || 0,
        row.totalUsed || 0,
        row.totalRemaining || 0
      ];
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Leave_Balance_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-400" />
            Leave Balance Report
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive breakdown of employee leave allocations, utilized quotas, and pending balances for {selectedYear}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2 border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!reportData.length}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Employees</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1.5">{totalEmployees}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <span>In leave tracking system</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Quota Allocated</p>
              <h3 className="text-2xl font-bold text-sky-400 mt-1.5">{totalAllocatedDays} <span className="text-xs text-slate-400 font-normal">days</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-400">
            <span>Across all policy types</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leaves Utilized</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1.5">{totalUsedDays} <span className="text-xs text-slate-400 font-normal">days</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 mr-1 inline" /> {utilizationRate}% overall consumption
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining Balance</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1.5">{totalRemainingDays} <span className="text-xs text-slate-400 font-normal">days</span></h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-400">
            <span>Available for employee requests</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name or employee code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
            <option value="2024">Year 2024</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Generating balance reports...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">Unable to load report</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{error.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-medium text-slate-300">No leave records found</h3>
            <p className="text-sm text-slate-500">No employee leave allocations match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department / Role</th>
                  <th className="px-6 py-4">Leave Types Breakdown</th>
                  <th className="px-6 py-4 text-center">Allocated</th>
                  <th className="px-6 py-4 text-center">Used</th>
                  <th className="px-6 py-4 text-center">Remaining</th>
                  <th className="px-6 py-4">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData.map((row) => {
                  const emp = row.employee || {};
                  const allowed = row.totalAllowed || 0;
                  const used = row.totalUsed || 0;
                  const remaining = row.totalRemaining || 0;
                  const pct = allowed > 0 ? Math.min(100, Math.round((used / allowed) * 100)) : 0;

                  return (
                    <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-center">
                            {emp.firstName?.[0] || 'E'}{emp.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee'}</p>
                            <p className="text-xs text-slate-400">{emp.employeeCode || emp.email || 'No Code'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-200">{emp.department || 'General'}</p>
                        <p className="text-xs text-slate-400">{emp.designation || 'Staff'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(row.balances || []).length > 0 ? (
                            row.balances.map((b, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300"
                                title={`${b.leaveTypeName || 'Leave'}: ${b.remainingDays} days remaining of ${b.totalDays}`}
                              >
                                <span className="font-bold text-indigo-400">{b.leaveTypeCode || 'LV'}:</span> {b.remainingDays}/{b.totalDays}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">No custom balances</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center font-medium text-slate-200">
                        {allowed}
                      </td>

                      <td className="px-6 py-4 text-center font-medium text-amber-400">
                        {used}
                      </td>

                      <td className="px-6 py-4 text-center font-bold text-emerald-400">
                        {remaining}
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
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
