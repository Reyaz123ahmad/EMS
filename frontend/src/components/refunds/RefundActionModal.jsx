import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, RefreshCw, Zap } from 'lucide-react';

export function RefundActionModal({ isOpen, onClose, actionType, refund, onConfirm, isPending }) {
  const [notes, setNotes] = useState('');
  const [speed, setSpeed] = useState('normal');

  if (!isOpen || !refund) return null;

  const isApprove = actionType === 'APPROVE';
  const isReject = actionType === 'REJECT';
  const isProcess = actionType === 'PROCESS';
  const isRetry = actionType === 'RETRY';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isApprove) onConfirm({ id: refund.id, adminNotes: notes });
    else if (isReject) onConfirm({ id: refund.id, rejectionReason: notes });
    else if (isProcess) onConfirm({ id: refund.id, speed });
    else if (isRetry) onConfirm(refund.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isApprove
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600'
                : isReject
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600'
            }`}
          >
            {isApprove && <CheckCircle2 className="w-5 h-5" />}
            {isReject && <XCircle className="w-5 h-5" />}
            {isProcess && <Zap className="w-5 h-5" />}
            {isRetry && <RefreshCw className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isApprove && 'Approve Refund Request'}
              {isReject && 'Reject Refund Request'}
              {isProcess && 'Process Razorpay Refund'}
              {isRetry && 'Retry Gateway Refund'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Refund ID: #{refund.id?.slice(0, 8)} • Amount: ₹{Number(refund.amount).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isApprove && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Approval / Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add verification details or internal remarks..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          {isReject && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                rows={3}
                placeholder="Explain why this refund cannot be authorized..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          )}

          {isProcess && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refund Processing Speed
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSpeed('normal')}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    speed === 'normal'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold block">Normal (Standard)</span>
                  <span className="text-[11px] text-slate-500">5-7 Business Days</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSpeed('optimum')}
                  className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                    speed === 'optimum'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-bold block">Optimum (Instant)</span>
                  <span className="text-[11px] text-slate-500">Instant UPI/IMPS</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-sm ${
                isApprove
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : isReject
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50`}
            >
              {isPending ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RefundActionModal;
