import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useShifts } from '../../hooks/useShifts';
import rosterService from '../../services/roster.service.js';
import useAuthStore from '../../store/auth.store.js';
import api from '../../services/api.js';

export default function GenerateRosterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const companyId = user?.companyId;

  const now = new Date();
  const [formData, setFormData] = useState({
    shiftId: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    pattern: '5_2',
    employeeIds: []
  });

  // Fetch shifts
  const { data: shiftsData, isLoading: shiftsLoading } = useShifts(companyId);
  const shifts = Array.isArray(shiftsData)
    ? shiftsData
    : Array.isArray(shiftsData?.shifts)
    ? shiftsData.shifts
    : Array.isArray(shiftsData?.data?.shifts)
    ? shiftsData.data.shifts
    : Array.isArray(shiftsData?.data)
    ? shiftsData.data
    : [];

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', 'active-roster', companyId],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 100, status: 'ACTIVE' } });
      const data = res.data?.data || res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.employees)) return data.employees;
      if (Array.isArray(res.data?.employees)) return res.data.employees;
      return [];
    }
  });

  const employees = Array.isArray(employeesData)
    ? employeesData
    : Array.isArray(employeesData?.employees)
    ? employeesData.employees
    : [];

  const generateMutation = useMutation({
    mutationFn: (data) => rosterService.generateRoster(data),
    onSuccess: () => {
      toast.success('Roster generated successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      setTimeout(() => navigate('/rosters/calendar'), 1200);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to generate roster');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.shiftId && shifts.length > 0) {
      // Default to first shift if none explicitly chosen
      formData.shiftId = shifts[0].id;
    }

    generateMutation.mutate({
      companyId,
      shiftId: formData.shiftId || undefined,
      month: Number(formData.month),
      year: Number(formData.year),
      shiftPattern: formData.pattern,
      employeeIds: formData.employeeIds.length > 0 ? formData.employeeIds : employees.map((emp) => emp.id)
    });
  };

  const handleToggleEmployee = (id) => {
    setFormData((prev) => ({
      ...prev,
      employeeIds: prev.employeeIds.includes(id)
        ? prev.employeeIds.filter((e) => e !== id)
        : [...prev.employeeIds, id]
    }));
  };

  const handleSelectAllEmployees = () => {
    if (formData.employeeIds.length === employees.length) {
      setFormData((prev) => ({ ...prev, employeeIds: [] }));
    } else {
      setFormData((prev) => ({ ...prev, employeeIds: employees.map((e) => e.id) }));
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
        <p className="text-slate-400 text-sm mt-1">
          Automatically generate structured month-long shifts for active workforce teams.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
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
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Base Shift</label>
            <select
              value={formData.shiftId}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose Shift (or Default) --</option>
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
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="5_2">5 Days Work, 2 Days Off (Mon-Fri Work)</option>
              <option value="6_1">6 Days Work, 1 Day Off (Mon-Sat Work)</option>
              <option value="ROTATING">Full Rotation (All Days)</option>
            </select>
          </div>

          {employees.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-300">
                  Target Employees ({formData.employeeIds.length > 0 ? formData.employeeIds.length : `All ${employees.length}`})
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllEmployees}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  {formData.employeeIds.length === employees.length ? 'Clear Selection' : 'Select All'}
                </button>
              </div>
              <div className="border border-slate-700 rounded-xl p-3 max-h-48 overflow-y-auto bg-slate-900/40 space-y-1">
                {employees.map((emp) => (
                  <label key={emp.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.employeeIds.includes(emp.id)}
                      onChange={() => handleToggleEmployee(emp.id)}
                      className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                    />
                    <span>
                      {emp.firstName} {emp.lastName} <span className="text-xs text-slate-500">({emp.employeeCode})</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/rosters')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={generateMutation.isPending}
            >
              Generate Roster Batch
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
