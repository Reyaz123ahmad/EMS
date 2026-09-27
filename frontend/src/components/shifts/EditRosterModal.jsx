import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { useShifts } from '../../hooks/useShifts';

export default function EditRosterModal({ roster, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    shiftId: roster?.shiftId || '',
    date: roster?.date ? new Date(roster.date).toISOString().split('T')[0] : '',
    isPublished: roster?.isPublished || false
  });

  const { data: shiftsData } = useShifts();
  const shifts = Array.isArray(shiftsData) ? shiftsData : (shiftsData?.shifts || []);

  useEffect(() => {
    if (roster) {
      setFormData({
        shiftId: roster.shiftId || '',
        date: roster.date ? new Date(roster.date).toISOString().split('T')[0] : '',
        isPublished: Boolean(roster.isPublished)
      });
    }
  }, [roster]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={!!roster} onClose={onClose} title="Edit Roster Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Employee
          </label>
          <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl text-sm text-slate-200">
            <span className="font-semibold text-white">
              {roster?.employee?.firstName} {roster?.employee?.lastName}
            </span>{' '}
            <span className="text-xs text-slate-400">
              ({roster?.employee?.employeeCode || 'No Code'})
            </span>
          </div>
        </div>

        <div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Shift
          </label>
          <select
            value={formData.shiftId}
            onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select shift</option>
            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-200">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span>Published</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
