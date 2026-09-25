import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useShifts, useAssignShift } from '../../hooks/useShifts';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function AssignShiftPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const { data: shiftsData } = useShifts(companyId);
  const assignShift = useAssignShift();

  const shifts = shiftsData?.data?.data || shiftsData?.data || [];

  const [formData, setFormData] = useState({
    shiftId: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    employeeIds: [],
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await assignShift.mutateAsync({
        companyId,
        shiftId: formData.shiftId,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || null,
        employeeIds: formData.employeeIds,
      });
      setSuccessMsg('Shift assigned successfully!');
      setTimeout(() => navigate('/shifts'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to assign shift');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/shifts')} className="mb-2">
          ← Back to Shifts
        </Button>
        <h1 className="text-2xl font-bold text-white">Assign Shift Schedule</h1>
        <p className="text-sm text-slate-400">Map employees or whole departments to target work schedules</p>
      </div>

      <Card className="p-6">
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✓ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            ✕ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Work Shift</label>
            <select
              required
              value={formData.shiftId}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Shift --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Effective From"
              type="date"
              required
              value={formData.effectiveFrom}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
            />
            <Input
              label="Effective To (Optional)"
              type="date"
              value={formData.effectiveTo}
              onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
            />
          </div>

          <p className="text-xs text-slate-400">
            Note: All active employees without customized roster entries will default to this assignment.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="primary" type="submit" loading={assignShift.isPending}>
              Assign Shift
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
