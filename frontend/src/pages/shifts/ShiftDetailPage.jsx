import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useShifts } from '../../hooks/useShifts';
import { useAuthStore } from '../../store/authStore';

export default function ShiftDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: shiftsData, isLoading } = useShifts(user?.companyId);
  const shifts = shiftsData?.data?.data || shiftsData?.data || [];
  const shift = shifts.find((s) => s.id === id);

  if (isLoading) return <div className="p-8 text-center text-slate-400">Loading shift details...</div>;

  if (!shift) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Shift record not found.</p>
        <Button variant="secondary" onClick={() => navigate('/shifts')}>
          Back to Shifts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/shifts')} className="mb-2">
            ← Back to Shifts
          </Button>
          <h1 className="text-2xl font-bold text-white">{shift.name}</h1>
          <p className="text-sm text-slate-400">Shift Code: {shift.code}</p>
        </div>
        <Badge variant={shift.isNightShift ? 'warning' : 'success'}>
          {shift.isNightShift ? 'Night Shift' : 'Day Shift'}
        </Badge>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block uppercase">Working Hours</span>
            <div className="text-xl font-bold text-white mt-1">
              {shift.startTime} - {shift.endTime}
            </div>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block uppercase">Grace Period</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {shift.gracePeriod || 15} Minutes
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Full Day Requirement</span>
            <span className="text-sm font-semibold text-slate-200">{shift.fullDayHours || 8} Hours</span>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Half Day Requirement</span>
            <span className="text-sm font-semibold text-slate-200">{shift.halfDayHours || 4} Hours</span>
          </div>
          <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Break Allocation</span>
            <span className="text-sm font-semibold text-slate-200">{shift.breakDuration || 60} Minutes</span>
          </div>
        </div>

        {/* Bound Break Rules List */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-300 block mb-2">Bound Break Policies:</span>
          {(!shift.shiftBreakRules || shift.shiftBreakRules.length === 0) ? (
            <p className="text-xs text-slate-500 italic">
              No custom break rules linked. Default company break limits (60m / 3 sessions) apply.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shift.shiftBreakRules.map((sbr) => {
                const rule = sbr.breakRule;
                if (!rule) return null;
                return (
                  <div
                    key={sbr.id || rule.id}
                    className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{rule.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {rule.durationMinutes} mins • {rule.maxPerShift}x per shift
                      </div>
                    </div>
                    <Badge variant={rule.isPaid ? 'success' : 'neutral'} className="text-[10px]">
                      {rule.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {shift.description && (
          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-1">Description:</span>
            <p className="text-sm text-slate-300">{shift.description}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
