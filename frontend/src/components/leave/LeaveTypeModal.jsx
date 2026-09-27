import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';

export default function LeaveTypeModal({ open, onClose, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    daysAllowed: 12,
    isPaid: true,
    carryForward: false,
    maxCarryForwardDays: 0,
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        daysAllowed: initialData.maxDaysPerYear || initialData.daysAllowed || 12,
        isPaid: initialData.isPaid ?? true,
        carryForward: initialData.carryForward ?? false,
        maxCarryForwardDays: initialData.maxCarryForward || initialData.maxCarryForwardDays || 0,
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        daysAllowed: 12,
        isPaid: true,
        carryForward: false,
        maxCarryForwardDays: 0,
        description: ''
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Leave type name is required');
      return;
    }
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={initialData ? 'Edit Leave Type' : 'Create Leave Type'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Type Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Annual Leave, Casual Leave"
        />

        <Input
          label="Leave Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          placeholder="e.g. AL, CL, SL"
        />

        <Input
          label="Max Days Per Year"
          type="number"
          required
          value={formData.daysAllowed}
          onChange={(e) => setFormData({ ...formData, daysAllowed: Number(e.target.value) })}
        />

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Brief description of when this applies..."
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPaid}
              onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
            />
            Paid Leave
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.carryForward}
              onChange={(e) => setFormData({ ...formData, carryForward: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
            />
            Allow Carry Forward
          </label>
        </div>

        {formData.carryForward && (
          <Input
            label="Max Carry Forward Days"
            type="number"
            value={formData.maxCarryForwardDays}
            onChange={(e) => setFormData({ ...formData, maxCarryForwardDays: Number(e.target.value) })}
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            {initialData ? 'Save Changes' : 'Create Type'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { LeaveTypeModal };
