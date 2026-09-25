import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useShifts, useGenerateRoster } from '../../hooks/useShifts';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function GenerateRosterPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [shiftId, setShiftId] = useState('');
  const [pattern, setPattern] = useState('5_2'); // 5 days on, 2 days off

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: shiftsData } = useShifts(companyId);
  const generateRoster = useGenerateRoster();

  const shifts = shiftsData?.data?.data || shiftsData?.data || [];

  const handleGenerate = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await generateRoster.mutateAsync({
        companyId,
        month: Number(month),
        year: Number(year),
        shiftId: shiftId || undefined,
        shiftPattern: pattern,
      });

      setSuccessMsg('Shift roster generated successfully!');
      setTimeout(() => navigate('/rosters/calendar'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to generate shift roster');
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/rosters')} className="mb-2">
          ← Back to Rosters
        </Button>
        <h1 className="text-2xl font-bold text-white">Automated Roster Generator</h1>
        <p className="text-sm text-slate-400">Generate rotational shift schedules for all active employees</p>
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

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Target Year"
              type="number"
              required
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Base Shift</label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Standard Assigned Shifts (Default) --</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Work Pattern</label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5_2">5 Days Work, 2 Days Off (Mon-Fri Work)</option>
              <option value="6_1">6 Days Work, 1 Day Off (Mon-Sat Work)</option>
              <option value="ROTATING">Rotational 4 On / 2 Off</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="primary" type="submit" loading={generateRoster.isPending}>
              Generate Roster Batch
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
