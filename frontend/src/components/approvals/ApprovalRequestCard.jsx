import React from 'react';
import { Clock, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';

export function ApprovalRequestCard({ request, onAction }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
    }
  };

  const isPending = request.status === 'PENDING';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {request.entityType} Request
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                {request.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Workflow: {request.workflow?.name || 'Standard Approval'} • Level {request.currentLevel || 1}
            </p>
          </div>
        </div>

        {isPending && onAction && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction(request, 'REJECT')}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => onAction(request, 'APPROVE')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span>Requested By: {request.requestedBy}</span>
        <span>{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Recent'}</span>
      </div>
    </div>
  );
}

export default ApprovalRequestCard;
