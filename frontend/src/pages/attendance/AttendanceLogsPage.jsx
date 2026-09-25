import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  ShieldCheck,
  Calendar,
  Building,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useAttendanceLogs } from '../../hooks/useAttendance';
import { DateRangePicker } from '../../components/shared/DateRangePicker';

export const AttendanceLogsPage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    status: '',
    search: '',
  });

  const { data: logsResponse, isLoading, refetch } = useAttendanceLogs(filters);

  const logs = logsResponse?.data?.logs || [];
  const pagination = logsResponse?.data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Employee', 'Date', 'Status', 'Check-In', 'Check-Out', 'Worked Mins', 'Late Mins', 'Method'];
    const rows = logs.map((log) => [
      log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : log.employeeId,
      dayjs(log.date).format('YYYY-MM-DD'),
      log.status,
      log.checkInAt ? dayjs(log.checkInAt).format('HH:mm:ss') : 'N/A',
      log.checkOutAt ? dayjs(log.checkOutAt).format('HH:mm:ss') : 'N/A',
      log.totalWorkedMinutes || 0,
      log.lateMinutes || 0,
      log.method || 'FACE',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Logs_${dayjs().format('YYYY-MM-DD')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance logs exported to CSV');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'LATE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HALF_DAY':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'ON_LEAVE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="min-h-screen space-y-6 p-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Audit & Compliance Terminal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Attendance Records & Logs
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Cryptographically signed biometric event trail with geofencing coordinates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker
            initialRange={{ startDate: filters.startDate, endDate: filters.endDate }}
            onApply={({ startDate, endDate }) =>
              setFilters((prev) => ({ ...prev, startDate, endDate, page: 1 }))
            }
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-3 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, code..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Check In / Out</th>
                <th className="px-5 py-3.5">Worked (Net)</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Verified Layers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                      <span>Loading attendance audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No biometric attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-300">
                          {log.employee?.firstName?.[0] || 'E'}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {log.employee
                              ? `${log.employee.firstName} ${log.employee.lastName}`
                              : 'Unknown Employee'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {log.employee?.employeeCode || log.employeeId?.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-300">
                      {dayjs(log.date).format('MMM DD, YYYY')}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono">
                      <div className="text-emerald-400">
                        In: {log.checkInAt ? dayjs(log.checkInAt).format('HH:mm:ss') : '--:--'}
                      </div>
                      <div className="text-rose-400">
                        Out: {log.checkOutAt ? dayjs(log.checkOutAt).format('HH:mm:ss') : '--:--'}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-200">
                      {log.totalWorkedMinutes
                        ? `${Math.floor(log.totalWorkedMinutes / 60)}h ${log.totalWorkedMinutes % 60}m`
                        : log.checkInAt && !log.checkOutAt
                        ? 'Active Shift'
                        : '0m'}
                      {log.lateMinutes > 0 && (
                        <span className="block text-[10px] text-amber-400">
                          +{log.lateMinutes}m Late
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase text-slate-300">
                        {log.method || 'FACE'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {log.verificationLayers &&
                          Object.entries(log.verificationLayers).map(([layer, passed]) => (
                            <span
                              key={layer}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                                passed
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {layer}
                            </span>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-3 text-xs text-slate-400">
          <div>
            Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
              className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AttendanceLogsPage;
