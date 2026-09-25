import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/formatters';

export default function OvertimeApprovalModal({ isOpen, onClose, request, onApprove, onReject, isSubmitting }) {
  const [remarks, setRemarks] = useState('');

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Overtime Request">
      <div className="space-y-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Employee</span>
            <span className="text-sm font-semibold text-white">
              {request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Date</span>
            <span className="text-sm text-slate-200">{formatDate(request.date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Duration</span>
            <span className="text-sm font-bold text-amber-400">
              {(request.minutes / 60).toFixed(1)} hrs ({request.minutes} minutes)
            </span>
          </div>
          {request.reason && (
            <div className="pt-2 border-t border-slate-700/50">
              <span className="text-xs text-slate-400 block mb-1">Reason:</span>
              <p className="text-sm text-slate-300 italic">{request.reason}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Remarks (Optional)</label>
          <textarea
            rows="3"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Approval remarks..."
            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onReject(request.id, remarks);
              setRemarks('');
            }}
            disabled={isSubmitting}
          >
            Reject
          </Button>
          <Button
            variant="success"
            onClick={() => {
              onApprove(request.id, remarks);
              setRemarks('');
            }}
            disabled={isSubmitting}
          >
            Approve Overtime
          </Button>
        </div>
      </div>
    </Modal>
  );
}
