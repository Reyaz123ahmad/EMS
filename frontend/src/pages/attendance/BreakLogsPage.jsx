import React, { useState, useMemo } from 'react';
import {
  Coffee,
  Search,
  Download,
  Calendar,
  User,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Eye,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  UtensilsCrossed,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import useAuthStore from '../../store/auth.store';
import {
  useBreaksReport,
  useBreaksSummary,
  useEmployeeBreaksReport
} from '../../hooks/useReports';
import { DateRangePicker } from '../../components/shared/DateRangePicker';

export const BreakLogsPage = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'EMPLOYEE';

  // Time preset: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  const [preset, setPreset] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD')
  });

  // View mode: 'summary' | 'all' | 'employee'
  const [viewMode, setViewMode] = useState('summary');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [breakTypeFilter, setBreakTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Quick preset changer
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    setPage(1);
    const today = dayjs();
    let from = today.format('YYYY-MM-DD');
    let to = today.format('YYYY-MM-DD');

    if (newPreset === 'daily') {
      from = today.format('YYYY-MM-DD');
      to = today.format('YYYY-MM-DD');
    } else if (newPreset === 'weekly') {
      from = today.startOf('week').format('YYYY-MM-DD');
      to = today.endOf('week').format('YYYY-MM-DD');
    } else if (newPreset === 'monthly') {
      from = today.startOf('month').format('YYYY-MM-DD');
      to = today.endOf('month').format('YYYY-MM-DD');
    } else if (newPreset === 'yearly') {
      from = today.startOf('year').format('YYYY-MM-DD');
      to = today.endOf('year').format('YYYY-MM-DD');
    }

    if (newPreset !== 'custom') {
      setDateRange({ from, to });
    }
  };

  // Queries
  const summaryQuery = useBreaksSummary({
    from: dateRange.from,
    to: dateRange.to
  });

  const allBreaksQuery = useBreaksReport({
    from: dateRange.from,
    to: dateRange.to,
    breakType: breakTypeFilter || undefined,
    page,
    limit
  });

  const employeeBreaksQuery = useEmployeeBreaksReport(selectedEmployee?.id, {
    from: dateRange.from,
    to: dateRange.to,
    breakType: breakTypeFilter || undefined,
    page,
    limit
  });

  // Summary list filtered by search
  const rawSummaryList = summaryQuery.data?.data?.summary || summaryQuery.data?.summary || [];
  const filteredSummary = useMemo(() => {
    if (!search.trim()) return rawSummaryList;
    const term = search.toLowerCase();
    return rawSummaryList.filter(
      (s) =>
        s.employeeName?.toLowerCase().includes(term) ||
        s.employeeCode?.toLowerCase().includes(term)
    );
  }, [rawSummaryList, search]);

  // All breaks list filtered by search
  const rawAllBreaks = allBreaksQuery.data?.data?.breaks || allBreaksQuery.data?.breaks || [];
  const allBreaksPagination = allBreaksQuery.data?.data?.pagination || allBreaksQuery.data?.pagination || {
    page: 1,
    limit: 50,
    total: rawAllBreaks.length,
    totalPages: 1
  };

  const filteredAllBreaks = useMemo(() => {
    if (!search.trim()) return rawAllBreaks;
    const term = search.toLowerCase();
    return rawAllBreaks.filter(
      (b) =>
        b.employee?.name?.toLowerCase().includes(term) ||
        b.employee?.code?.toLowerCase().includes(term)
    );
  }, [rawAllBreaks, search]);

  // Single employee breaks list
  const rawEmployeeBreaks = employeeBreaksQuery.data?.data?.breaks || employeeBreaksQuery.data?.breaks || [];
  const employeePagination = employeeBreaksQuery.data?.data?.pagination || employeeBreaksQuery.data?.pagination || {
    page: 1,
    limit: 50,
    total: rawEmployeeBreaks.length,
    totalPages: 1
  };

  // CSV Export
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `break-logs-${dateRange.from}-to-${dateRange.to}.csv`;

    if (viewMode === 'summary') {
      if (filteredSummary.length === 0) {
        toast.error('No summary records to export');
        return;
      }
      headers = ['Employee Code', 'Employee Name', 'Total Breaks', 'Total Break Minutes', 'Short Breaks', 'Lunch Breaks'];
      rows = filteredSummary.map((s) => [
        `"${s.employeeCode || ''}"`,
        `"${s.employeeName || ''}"`,
        s.totalBreaks || 0,
        s.totalMinutes || 0,
        s.breakdown?.SHORT?.count || 0,
        s.breakdown?.LUNCH?.count || 0
      ]);
      filename = `break-summary-${dateRange.from}-to-${dateRange.to}.csv`;
    } else if (viewMode === 'employee') {
      if (rawEmployeeBreaks.length === 0) {
        toast.error('No break records to export for this employee');
        return;
      }
      headers = ['Date', 'Break Type', 'Start Time', 'End Time', 'Minutes'];
      rows = rawEmployeeBreaks.map((b) => [
        `"${b.attendanceDate || ''}"`,
        `"${b.breakType || 'SHORT'}"`,
        `"${b.breakStartAt ? new Date(b.breakStartAt).toLocaleTimeString() : ''}"`,
        `"${b.breakEndAt ? new Date(b.breakEndAt).toLocaleTimeString() : 'In Progress'}"`,
        b.totalBreakMinutes || 0
      ]);
      filename = `breaks-${selectedEmployee?.code || 'employee'}-${dateRange.from}-to-${dateRange.to}.csv`;
    } else {
      if (filteredAllBreaks.length === 0) {
        toast.error('No break logs to export');
        return;
      }
      headers = ['Employee Code', 'Employee Name', 'Date', 'Break Type', 'Start Time', 'End Time', 'Minutes'];
      rows = filteredAllBreaks.map((b) => [
        `"${b.employee?.code || ''}"`,
        `"${b.employee?.name || ''}"`,
        `"${b.attendanceDate || ''}"`,
        `"${b.breakType || 'SHORT'}"`,
        `"${b.breakStartAt ? new Date(b.breakStartAt).toLocaleTimeString() : ''}"`,
        `"${b.breakEndAt ? new Date(b.breakEndAt).toLocaleTimeString() : 'In Progress'}"`,
        b.totalBreakMinutes || 0
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully');
  };

  const handleOpenEmployee = (emp) => {
    setSelectedEmployee(emp);
    setViewMode('employee');
    setPage(1);
  };

  const handleBackToSummary = () => {
    setSelectedEmployee(null);
    setViewMode('summary');
    setPage(1);
  };

  const formatMinutes = (minutes) => {
    const mins = Number(minutes) || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getBreakBadge = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('LUNCH')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
          <UtensilsCrossed className="h-3 w-3" />
          {type || 'Lunch'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400 border border-indigo-500/20">
        <Coffee className="h-3 w-3" />
        {type || 'Short Break'}
      </span>
    );
  };

  const isCurrentLoading =
    viewMode === 'summary'
      ? summaryQuery.isLoading
      : viewMode === 'employee'
      ? employeeBreaksQuery.isLoading
      : allBreaksQuery.isLoading;

  const handleRefresh = () => {
    if (viewMode === 'summary') summaryQuery.refetch();
    else if (viewMode === 'employee') employeeBreaksQuery.refetch();
    else allBreaksQuery.refetch();
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <Coffee className="h-4 w-4" />
            <span>Attendance & Time Audit</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Break Logs
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Audit company-wide employee break records, durations, and interval timestamps
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Buttons */}
          <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-xs">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetChange(p)}
                className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition-all ${
                  preset === p
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <DateRangePicker
            initialRange={{ startDate: dateRange.from, endDate: dateRange.to }}
            onApply={({ startDate, endDate }) => {
              setPreset('custom');
              setDateRange({ from: startDate, endDate: endDate, to: endDate });
              setPage(1);
            }}
          />

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Navigation / Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        {viewMode === 'employee' ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToSummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Summary
            </button>
            <div className="border-l border-slate-700 pl-3">
              <h2 className="text-sm font-bold text-white">
                {selectedEmployee?.name || selectedEmployee?.employeeName || 'Employee History'}
              </h2>
              <span className="text-xs text-indigo-400">
                Code: {selectedEmployee?.code || selectedEmployee?.employeeCode || 'N/A'}
              </span>
            </div>
          </div>
        ) : (
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('summary');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-1.5 font-bold transition-all ${
                viewMode === 'summary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Summary View
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('all');
                setPage(1);
              }}
              className={`rounded-lg px-4 py-1.5 font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Breaks Log
            </button>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-3 min-w-[280px]">
          {/* Search box */}
          {viewMode !== 'employee' && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Break type filter (for all logs or employee logs) */}
          {viewMode !== 'summary' && (
            <select
              value={breakTypeFilter}
              onChange={(e) => {
                setBreakTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Break Types</option>
              <option value="SHORT">Short Break</option>
              <option value="LUNCH">Lunch Break</option>
              <option value="TEA">Tea Break</option>
            </select>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isCurrentLoading ? 'animate-spin text-indigo-400' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          {viewMode === 'summary' ? (
            /* ================= VIEW 1: SUMMARY VIEW ================= */
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Total Breaks</th>
                  <th className="px-5 py-3.5">Total Duration</th>
                  <th className="px-5 py-3.5">Breakdown</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summaryQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                        <span>Loading break summary records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No breaks recorded for this period.
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((item) => (
                    <tr
                      key={item.employeeId}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() =>
                        handleOpenEmployee({
                          id: item.employeeId,
                          name: item.employeeName,
                          code: item.employeeCode
                        })
                      }
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                            {item.employeeName?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {item.employeeName || 'Unknown Employee'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Code: {item.employeeCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200">
                        {item.totalBreaks} {item.totalBreaks === 1 ? 'break' : 'breaks'}
                      </td>
                      <td className="px-5 py-4 font-bold text-indigo-400">
                        {formatMinutes(item.totalMinutes)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.breakdown || {}).map(([type, stats]) => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/60"
                            >
                              <span className="font-semibold">{type}:</span> {stats.count} (
                              {formatMinutes(stats.minutes)})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEmployee({
                              id: item.employeeId,
                              name: item.employeeName,
                              code: item.employeeCode
                            });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : viewMode === 'employee' ? (
            /* ================= VIEW 2: EMPLOYEE DETAIL VIEW ================= */
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Break Type</th>
                  <th className="px-5 py-3.5">Start Time</th>
                  <th className="px-5 py-3.5">End Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employeeBreaksQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                        <span>Loading employee break records...</span>
                      </div>
                    </td>
                  </tr>
                ) : rawEmployeeBreaks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No breaks recorded for this period.
                    </td>
                  </tr>
                ) : (
                  rawEmployeeBreaks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-200">
                        {item.attendanceDate || (item.breakStartAt ? dayjs(item.breakStartAt).format('YYYY-MM-DD') : 'N/A')}
                      </td>
                      <td className="px-5 py-4">{getBreakBadge(item.breakType)}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {item.breakStartAt ? dayjs(item.breakStartAt).format('hh:mm A') : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {item.breakEndAt ? (
                          dayjs(item.breakEndAt).format('hh:mm A')
                        ) : (
                          <span className="text-amber-400 font-semibold">Ongoing</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-indigo-400">
                        {formatMinutes(item.totalBreakMinutes)}
                      </td>
                      <td className="px-5 py-4">
                        {item.breakEndAt ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                            <Timer className="h-3 w-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* ================= VIEW 3: ALL EMPLOYEES BREAK LOGS ================= */
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Break Type</th>
                  <th className="px-5 py-3.5">Start Time</th>
                  <th className="px-5 py-3.5">End Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allBreaksQuery.isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                        <span>Loading all break records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAllBreaks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No breaks recorded for this period.
                    </td>
                  </tr>
                ) : (
                  filteredAllBreaks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                            {item.employee?.name?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {item.employee?.name || 'Unknown Employee'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Code: {item.employee?.code || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-200">
                        {item.attendanceDate || (item.breakStartAt ? dayjs(item.breakStartAt).format('YYYY-MM-DD') : 'N/A')}
                      </td>
                      <td className="px-5 py-4">{getBreakBadge(item.breakType)}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {item.breakStartAt ? dayjs(item.breakStartAt).format('hh:mm A') : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {item.breakEndAt ? (
                          dayjs(item.breakEndAt).format('hh:mm A')
                        ) : (
                          <span className="text-amber-400 font-semibold">Ongoing</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-indigo-400">
                        {formatMinutes(item.totalBreakMinutes)}
                      </td>
                      <td className="px-5 py-4">
                        {item.breakEndAt ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                            <Timer className="h-3 w-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {viewMode !== 'summary' && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/80 px-6 py-4">
            <div className="text-xs text-slate-400">
              Showing page{' '}
              <span className="font-bold text-white">
                {viewMode === 'employee' ? employeePagination.page : allBreaksPagination.page}
              </span>{' '}
              of{' '}
              <span className="font-bold text-white">
                {viewMode === 'employee'
                  ? employeePagination.totalPages
                  : allBreaksPagination.totalPages}
              </span>{' '}
              (
              {viewMode === 'employee' ? employeePagination.total : allBreaksPagination.total}{' '}
              total break records)
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={
                  (viewMode === 'employee' ? employeePagination.page : allBreaksPagination.page) <= 1
                }
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                Previous
              </button>
              <button
                type="button"
                disabled={
                  viewMode === 'employee'
                    ? employeePagination.page >= employeePagination.totalPages
                    : allBreaksPagination.page >= allBreaksPagination.totalPages
                }
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakLogsPage;
