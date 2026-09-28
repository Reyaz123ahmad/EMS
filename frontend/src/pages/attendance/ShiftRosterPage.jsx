import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

export default function ShiftRosterPage() {
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['attendance', 'shift-roster'],
    queryFn: async () => {
      const res = await api.get('/attendance/shift-roster');
      return res.data;
    }
  });

  const data = response?.data || {};
  const shifts = data.shifts || [];
  const rosters = data.rosters || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-indigo-400" />
            Shift Rosters & Schedules
          </h1>
          <p className="text-sm text-slate-400">
            Workforce shift assignment distribution, active rotations, and roster calendar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Shifts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.length > 0 ? (
          shifts.map((shift) => (
            <Card key={shift.id} className="p-5 bg-slate-900 border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-base">{shift.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                  {shift.code || 'SHIFT'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <p className="text-xs text-slate-500">{shift.description || 'Standard working rotation'}</p>
            </Card>
          ))
        ) : (
          <Card className="p-5 bg-slate-900 border-slate-800 col-span-full text-center py-6 text-slate-400">
            <p className="text-sm font-semibold text-slate-300">Standard General Shift Active</p>
            <p className="text-xs text-slate-500 mt-1">09:00 AM - 05:00 PM (Default Company Policy)</p>
          </Card>
        )}
      </div>

      {/* Roster Assignment Table */}
      <Card className="p-6 space-y-4 bg-slate-900 border-slate-800">
        <h2 className="text-lg font-bold text-white">Active Roster Assignments</h2>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : rosters.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No Custom Rosters Configured</p>
            <p className="text-xs">Employees are operating under standard default company shift timings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Assigned Shift</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rosters.map((roster) => (
                  <tr key={roster.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-white">
                      {roster.employee?.firstName} {roster.employee?.lastName} ({roster.employee?.employeeCode || 'N/A'})
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-400">
                      {roster.shift?.name || 'General Shift'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {roster.shift?.startTime} - {roster.shift?.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        ACTIVE
                      </span>
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
