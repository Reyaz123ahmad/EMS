import React, { useState } from 'react';
import { User, Calendar, Clock, FileText, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';

export default function ManualAttendanceForm({ employees = [], onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      checkIn: formData.checkIn ? `${formData.date}T${formData.checkIn}:00.000Z` : null,
      checkOut: formData.checkOut ? `${formData.date}T${formData.checkOut}:00.000Z` : null
    };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white">Record Manual Attendance Override</h3>
        <p className="text-xs text-slate-400">Record administrative attendance or adjust punch records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Employee</label>
          <select
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Attendance Date</label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Check In Time</label>
          <Input
            type="time"
            name="checkIn"
            value={formData.checkIn}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Check Out Time</label>
          <Input
            type="time"
            name="checkOut"
            value={formData.checkOut}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Attendance Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="HALF_DAY">HALF_DAY</option>
            <option value="ABSENT">ABSENT</option>
            <option value="ON_LEAVE">ON_LEAVE</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Reason / Remarks</label>
          <textarea
            name="reason"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Specify reason for manual override (e.g. Card malfunctioning, on-site client visit)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button type="submit" variant="primary" loading={isLoading}>
          Record Attendance
        </Button>
      </div>
    </form>
  );
}
