import React, { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function LeaveRequestModal({ isOpen, onClose, leaveTypes = [], onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Leave">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Leave Type</label>
          <select
            name="leaveTypeId"
            value={formData.leaveTypeId}
            onChange={handleChange}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select Leave Type</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.isPaid ? 'Paid' : 'Unpaid'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Start Date</label>
            <Input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">End Date</label>
            <Input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Reason</label>
          <textarea
            name="reason"
            rows="3"
            value={formData.reason}
            onChange={handleChange}
            placeholder="Reason for requesting time off..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
