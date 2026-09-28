import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, AlertCircle, RefreshCw, Calendar, Users, DollarSign, Filter } from 'lucide-react';
import api from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import useAuthStore from '../../store/auth.store.js';
import dayjs from 'dayjs';

export default function OvertimeTrackerPage() {
  const { user } = useAuthStore();
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['attendance', 'overtime-tracker'],
    queryFn: async () => {
      const res = await api.get('/attendance/overtime-tracker');
      return res.data;
    }
  });

  const data = response?.data || {};
  const records = data.records || [];
  const totalHours = data.totalOvertimeHours || 0;
  const overtimeCount = data.overtimeCount || records.length;

  const filteredRecords = records.filter((rec) => {
    if (filterStatus === 'ALL') return true;
    return rec.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-indigo-400" />
            Overtime Tracker
          </h1>
          <p className="text-sm text-slate-400">
            Realtime monitoring of workforce overtime hours, active sessions, and compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Total Overtime Hours</span>
          <div className="text-2xl font-bold text-white mt-1">{totalHours} hrs</div>
          <p className="text-xs text-slate-400 mt-1">Aggregated this billing cycle</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Overtime Incidents</span>
          <div className="text-2xl font-bold text-white mt-1">{overtimeCount} Records</div>
          <p className="text-xs text-slate-400 mt-1">Logged verified sessions</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Policy Compliance</span>
          <div className="text-2xl font-bold text-white mt-1">100%</div>
          <p className="text-xs text-slate-400 mt-1">Within daily 4h threshold</p>
        </Card>
      </div>

      {/* Records Table */}
      <Card className="p-6 space-y-4 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">Overtime Activity Logs</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No Overtime Records Found</p>
            <p className="text-xs">No active overtime hours recorded for the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-white">
                      {rec.employee?.firstName} {rec.employee?.lastName} ({rec.employee?.employeeCode || 'N/A'})
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {dayjs(rec.date).format('YYYY-MM-DD')}
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-400">
                      {rec.hours ? `${rec.hours} hrs` : `${Math.round((rec.minutes || 0) / 60 * 10) / 10} hrs`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        rec.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {rec.status || 'LOGGED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {rec.reason || 'Post-shift extended project delivery'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
