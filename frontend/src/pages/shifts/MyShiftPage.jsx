import React, { useState } from 'react';
import { useMyShift } from '../../hooks/useShifts';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Clock, Calendar, CheckCircle2, Coffee, ShieldAlert, User, ArrowRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import { toast } from 'sonner';

function calculateHours(start, end, isNight = false) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (isNaN(sh) || isNaN(eh)) return null;
  let startMin = sh * 60 + (sm || 0);
  let endMin = eh * 60 + (em || 0);
  if (isNight || endMin <= startMin) endMin += 24 * 60;
  const hrs = (endMin - startMin) / 60;
  return Number.isInteger(hrs) ? hrs : Number(hrs.toFixed(1));
}

export default function MyShiftPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const { data: myShiftData, isLoading, isFetching, refetch } = useMyShift();

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
      toast.success('Shift schedule updated');
    } catch (err) {
      toast.error('Failed to refresh shift');
    } finally {
      setTimeout(() => {
        setIsManualRefreshing(false);
      }, 400);
    }
  };

  const isSpinning = isManualRefreshing || isFetching;

  const isManagement = user?.role === 'COMPANY_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'HR_MANAGER';

  const shift = myShiftData?.shift;
  const assignment = myShiftData?.assignment;
  const employee = myShiftData?.employee;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-800 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-900/60 border border-slate-800 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <Clock className="w-8 h-8 text-indigo-400" />
              My Work Schedule & Shift
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              View your active work roster, timing boundaries, and break allowances.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isSpinning}
            className="flex items-center gap-2 w-fit"
          >
            <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card className="p-12 text-center bg-slate-900/60 border-slate-800 space-y-4">
          <Clock className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Shift Assigned</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not have an active work shift assignment. Please contact your company HR administrator.
          </p>
          {isManagement && (
            <Button variant="primary" size="sm" onClick={() => navigate('/shifts/assign')}>
              Assign Shift Policy
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const breakRules = shift.shiftBreakRules?.map(r => r.breakRule).filter(Boolean) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Clock className="w-8 h-8 text-indigo-400" />
            My Work Schedule & Shift
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Official operational schedule, biometric grace margins, and break policy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isSpinning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isManagement && (
            <Button variant="primary" size="sm" onClick={() => navigate('/shifts')}>
              Manage Shifts <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Shift Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 bg-slate-900/60 border-slate-800 backdrop-blur-md space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Active Operational Shift
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">{shift.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {shift.isNightShift ? 'Overnight Shift Policy' : 'Standard Daytime Schedule'}
              </p>
            </div>
            <Badge variant="success">
              ACTIVE
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-center">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Start Time</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">{shift.startTime}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">End Time</span>
              <span className="text-base font-bold text-white font-mono mt-0.5 block">{shift.endTime}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Working Hours</span>
              <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                {calculateHours(shift.startTime, shift.endTime, shift.isNightShift) ?? shift.workingHours}h
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Grace Period</span>
              <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">{shift.graceMinutes} min</span>
            </div>
          </div>

          {/* Break Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-400" />
              Allowed Break Intervals
            </h3>
            {breakRules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {breakRules.map((br) => (
                  <div key={br.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-white">{br.name}</div>
                      <div className="text-[11px] text-slate-400">{br.isPaid ? 'Paid Rest Interval' : 'Unpaid Meal Interval'}</div>
                    </div>
                    <span className="font-mono font-bold text-indigo-400">{br.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-950/30 border border-slate-800">
                Standard break policy applies (1x 30 min lunch, 2x 15 min short breaks).
              </div>
            )}
          </div>
        </Card>

        {/* Shift Assignment Meta Card */}
        <Card className="p-6 bg-slate-900/60 border-slate-800 backdrop-blur-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-400" />
            Assignment Details
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            {employee && (
              <div className="pb-3 border-b border-slate-800 space-y-1">
                <span className="text-slate-500 block">Assigned Member</span>
                <span className="font-semibold text-white">{employee.firstName} {employee.lastName}</span>
                <span className="block font-mono text-[11px] text-slate-400">{employee.employeeCode}</span>
              </div>
            )}

            <div className="pb-3 border-b border-slate-800 space-y-1">
              <span className="text-slate-500 block">Effective From</span>
              <span className="font-mono text-white">
                {assignment?.effectiveFrom ? new Date(assignment.effectiveFrom).toLocaleDateString() : 'Active since onboarding'}
              </span>
            </div>

            <div className="pb-3 border-b border-slate-800 space-y-1">
              <span className="text-slate-500 block">Effective Until</span>
              <span className="font-mono text-white">
                {assignment?.effectiveTo ? new Date(assignment.effectiveTo).toLocaleDateString() : 'Permanent / Ongoing'}
              </span>
            </div>

            <div className="pt-2">
              <span className="text-slate-500 block">Late Punch Penalty</span>
              <span className="text-amber-400 font-semibold mt-0.5 block">
                Triggers if checkout occurs before {shift.endTime} or punch in is after {shift.startTime} + {shift.graceMinutes}m.
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
