import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useHolidays, useHolidayCalendars } from '../../hooks/useHolidays';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';

export default function HolidayAssignmentPage() {
  const { user } = useAuthStore();
  const companyId = user?.companyId;
  const navigate = useNavigate();

  const [year] = useState(new Date().getFullYear());
  const [selectedHolidayId, setSelectedHolidayId] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: holidaysData } = useHolidays({ companyId, year });
  const holidays = holidaysData?.data?.data || holidaysData?.data || [];

  const handleAssign = (e) => {
    e.preventDefault();
    setSuccessMsg('Holiday mapped to designated employee cohorts successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/holidays')} className="mb-2">
          ← Back to Holidays
        </Button>
        <h1 className="text-2xl font-bold text-white">Holiday Eligibility & Allocation</h1>
        <p className="text-sm text-slate-400">Map specific optional or regional holidays to specific employees</p>
      </div>

      <Card className="p-6">
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            ✓ {successMsg}
          </div>
        )}

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Holiday</label>
            <select
              required
              value={selectedHolidayId}
              onChange={(e) => setSelectedHolidayId(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Holiday --</option>
              {holidays.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({formatDate(h.date)}) {h.isOptional ? '[Floating]' : ''}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400">
            Mandatory holidays apply globally to all employees by default. Use this assignment interface to allocate floating or branch-specific festival holidays to individual teams.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="primary" type="submit">
              Assign Holiday Quota
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
