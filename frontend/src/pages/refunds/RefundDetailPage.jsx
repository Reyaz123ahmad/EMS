import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRefund } from '../../hooks/useRefunds.js';
import RefundStatusBadge from '../../components/refunds/RefundStatusBadge.jsx';
import RefundTimeline from '../../components/refunds/RefundTimeline.jsx';
import { ArrowLeft, IndianRupee, Calendar, ShieldCheck, CreditCard, Building2 } from 'lucide-react';

export function RefundDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useRefund(id);

  const refund = data?.refund || data;

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading refund record...</div>;
  }

  if (!refund) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Refund record not found</h3>
        <Link to="/refunds" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Return to refunds
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/refunds"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Refund #{refund.id?.slice(0, 8)}</h1>
              <RefundStatusBadge status={refund.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submitted on {new Date(refund.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Refund Amount
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-1">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <span>{Number(refund.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Refund Type
            </span>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {refund.refundType?.replace('_', ' ')}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Payment Reference
            </span>
            <p className="text-base font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              #{refund.paymentId?.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Reason & Notes */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reason Stated</h4>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {refund.reason?.replace('_', ' ')}
            </p>
          </div>

          {refund.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description / Feedback</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {refund.description}
              </p>
            </div>
          )}

          {refund.adminNotes && (
            <div>
              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Super Admin Notes</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60">
                {refund.adminNotes}
              </p>
            </div>
          )}

          {refund.rejectionReason && (
            <div>
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Rejection Remarks</h4>
              <p className="text-sm text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800/60">
                {refund.rejectionReason}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Tracking */}
      <RefundTimeline refund={refund} />
    </div>
  );
}

export default RefundDetailPage;
