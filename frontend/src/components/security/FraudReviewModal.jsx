import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Ban, AlertTriangle } from 'lucide-react';

export function FraudReviewModal({ signal, isOpen, onClose, onAction, isSubmitting }) {
  const [notes, setNotes] = useState('');

  if (!isOpen || !signal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Review Security Signal</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Signal Details */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Signal ID:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{signal.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Signal Type:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{signal.signalType || signal.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Severity:</span>
            <span className="font-bold text-rose-600">{signal.severity || 'HIGH'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Reason:</span>
            <span className="text-slate-700 dark:text-slate-300">{signal.reason || signal.description}</span>
          </div>
        </div>

        {/* Review Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Investigation Findings & Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add justification for approval, dismissal, or account block..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onAction('DISMISS', notes)}
            className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Dismiss Signal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onAction('APPROVE_PUNCH', notes)}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            Approve Punch
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onAction('BLOCK_USER', notes)}
            className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
          >
            Block Employee
          </button>
        </div>
      </div>
    </div>
  );
}

export default FraudReviewModal;
