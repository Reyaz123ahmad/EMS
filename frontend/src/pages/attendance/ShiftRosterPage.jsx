import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Users, RefreshCw, Plus, Trash2, Calendar, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api.js';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';

export default function ShiftRosterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['attendance', 'shift-roster'],
    queryFn: async () => {
      const res = await api.get('/attendance/shift-roster');
      return res.data;
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/shifts/assignments/${id}`);
    },
    onSuccess: () => {
      toast.success('Shift assignment removed successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance', 'shift-roster'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove assignment');
      setDeleteTarget(null);
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
          <Button variant="secondary" size="sm" onClick={() => navigate('/shifts/rosters')} className="gap-2">
            <Calendar className="w-4 h-4" />
            Roster Calendar
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/shifts/assign')} className="gap-2">
            <Plus className="w-4 h-4" />
            Assign Shift
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
                  {shift.code || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              <p className="text-xs text-slate-500">{shift.description || `Grace period: ${shift.graceMinutes || 15} mins`}</p>
            </Card>
          ))
        ) : (
          <Card className="p-5 bg-slate-900 border-slate-800 col-span-full text-center py-6 text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No shifts configured</p>
            <p className="text-xs text-slate-500 mt-1">Please configure active company shifts in Shift Management.</p>
          </Card>
        )}
      </div>

      {/* Roster Assignment Table */}
      <Card className="p-6 space-y-4 bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Shift Assignments & Rosters</h2>
          <span className="text-xs text-slate-400">{rosters.length} assigned records</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Spinner size="lg" />
          </div>
        ) : rosters.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No Custom Shift Assignments Configured</p>
            <p className="text-xs">Employees are operating under standard default company shift timings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Assigned Shift</th>
                  <th className="px-4 py-3">Shift Timing</th>
                  <th className="px-4 py-3">Duration / Validity</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rosters.map((roster) => (
                  <tr key={roster.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-medium text-white">
                      <div>
                        <div className="font-semibold">{roster.employee?.firstName} {roster.employee?.lastName}</div>
                        <div className="text-xs text-slate-400 font-mono">{roster.employee?.employeeCode || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-400">
                      {roster.shift?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {roster.shift?.startTime} - {roster.shift?.endTime}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {roster.effectiveFrom ? (
                        <span>
                          {new Date(roster.effectiveFrom).toLocaleDateString()}
                          {' → '}
                          {roster.effectiveTo ? new Date(roster.effectiveTo).toLocaleDateString() : 'Ongoing (Permanent)'}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => setDeleteTarget(roster)}
                        className="gap-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Remove Shift Assignment"
        message={`Are you sure you want to remove the shift assignment for ${deleteTarget?.employee?.firstName} ${deleteTarget?.employee?.lastName}? They will revert to the company default shift.`}
        confirmText="Remove Assignment"
        confirmVariant="danger"
        isLoading={removeMutation.isPending}
        onConfirm={() => deleteTarget && removeMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
