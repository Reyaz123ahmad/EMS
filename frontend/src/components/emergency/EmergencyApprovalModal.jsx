import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

export function EmergencyApprovalModal({ isOpen, onClose, request, action = 'APPROVE', onConfirm, isSubmitting }) {
  const [notes, setNotes] = useState('');

  if (!isOpen || !request) return null;

  const isApprove = action === 'APPROVE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isApprove ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-500" />
            )}
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {isApprove ? 'Approve Emergency Attendance' : 'Reject Emergency Request'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Employee:</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {request.employee?.firstName} {request.employee?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {new Date(request.date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reason:</span>
            <span className="text-slate-700 dark:text-slate-300">{request.reason}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {isApprove ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required={!isApprove}
            placeholder={isApprove ? 'Add optional verification notes...' : 'Reason for rejecting attendance...'}
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || (!isApprove && !notes.trim())}
            onClick={() => onConfirm(request.id, action, notes)}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 ${
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {isSubmitting ? 'Processing...' : isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmergencyApprovalModal;
