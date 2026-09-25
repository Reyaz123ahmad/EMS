import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function ShiftAssignmentModal({ isOpen, onClose, shift, onAssign, isSubmitting }) {
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [effectiveTo, setEffectiveTo] = useState('');

  if (!shift) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign({
      shiftId: shift.id,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Shift: ${shift.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-1">
          <div className="text-sm font-semibold text-white">{shift.name} ({shift.code})</div>
          <div className="text-xs text-slate-400">
            Timing: {shift.startTime} - {shift.endTime} | Grace: {shift.gracePeriod || 15}m
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Effective From"
            type="date"
            required
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
          />
          <Input
            label="Effective Until (Optional)"
            type="date"
            value={effectiveTo}
            onChange={(e) => setEffectiveTo(e.target.value)}
          />
        </div>

        <p className="text-xs text-slate-400">
          Note: This will assign this active shift schedule to the selected employees starting from the effective date.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
