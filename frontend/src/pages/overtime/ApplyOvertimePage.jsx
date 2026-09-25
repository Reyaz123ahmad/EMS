import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useApplyOvertime } from '../../hooks/useOvertime';
import { useAuthStore } from '../../store/authStore';

export default function ApplyOvertimePage() {
  const { user } = useAuthStore();
  const employeeId = user?.employeeId || user?.id;
  const companyId = user?.companyId;

  const applyOvertime = useApplyOvertime();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    minutes: 60,
    reason: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await applyOvertime.mutateAsync({
        employeeId,
        companyId,
        date: formData.date,
        minutes: Number(formData.minutes),
        reason: formData.reason,
      });
      setSuccessMsg('Overtime claim submitted successfully for manager approval.');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        minutes: 60,
        reason: '',
      });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit overtime claim');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Claim Overtime Hours</h1>
        <p className="text-sm text-slate-400">Submit extra hours worked outside assigned shift schedule</p>
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
          <Input
            label="Work Date"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Overtime Duration (Minutes)
            </label>
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                step="15"
                min="15"
                required
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: Number(e.target.value) })}
                className="w-40"
              />
              <span className="text-sm text-slate-400">
                = {(formData.minutes / 60).toFixed(2)} hours
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Reason / Task Description</label>
            <textarea
              required
              rows="4"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain the urgent project tasks or customer delivery completed..."
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="primary" type="submit" loading={applyOvertime.isPending}>
              Submit Overtime Claim
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
