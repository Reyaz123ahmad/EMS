import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  useRefund,
  useApproveRefund,
  useRejectRefund,
  useProcessRefund,
  useRetryRefund
} from '../../hooks/useRefunds.js';
import RefundStatusBadge from '../../components/refunds/RefundStatusBadge.jsx';
import RefundTimeline from '../../components/refunds/RefundTimeline.jsx';
import RefundActionModal from '../../components/refunds/RefundActionModal.jsx';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Zap,
  RefreshCw,
  Building2,
  IndianRupee,
  CreditCard,
  FileText
} from 'lucide-react';

export function AdminRefundDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRefund(id);

  const { mutateAsync: approveRefund, isPending: approving } = useApproveRefund();
  const { mutateAsync: rejectRefund, isPending: rejecting } = useRejectRefund();
  const { mutateAsync: processRefund, isPending: processing } = useProcessRefund();
  const { mutateAsync: retryRefund, isPending: retrying } = useRetryRefund();

  const [modalState, setModalState] = useState({
    isOpen: false,
    actionType: null // 'APPROVE' | 'REJECT' | 'PROCESS' | 'RETRY'
  });

  const refund = data?.refund || data;

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading refund review...</div>;
  }

  if (!refund) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Refund record not found</h3>
        <Link to="/admin/refunds" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Return to Admin Queue
        </Link>
      </div>
    );
  }

  const handleActionConfirm = async (payload) => {
    try {
      if (modalState.actionType === 'APPROVE') {
        await approveRefund(payload);
      } else if (modalState.actionType === 'REJECT') {
        await rejectRefund(payload);
      } else if (modalState.actionType === 'PROCESS') {
        await processRefund(payload);
      } else if (modalState.actionType === 'RETRY') {
        await retryRefund(payload);
      }
      setModalState({ isOpen: false, actionType: null });
    } catch (err) {
      // toast shown in hook
    }
  };

  const isPending = refund.status === 'PENDING';
  const isApproved = refund.status === 'APPROVED';
  const isFailed = refund.status === 'FAILED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/refunds"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Review Refund #{refund.id?.slice(0, 8)}</h1>
              <RefundStatusBadge status={refund.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Company ID: {refund.companyId}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button
                onClick={() => setModalState({ isOpen: true, actionType: 'APPROVE' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setModalState({ isOpen: true, actionType: 'REJECT' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {isApproved && (
            <button
              onClick={() => setModalState({ isOpen: true, actionType: 'PROCESS' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" /> Process Payout
            </button>
          )}

          {isFailed && (
            <button
              onClick={() => setModalState({ isOpen: true, actionType: 'RETRY' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry Payout
            </button>
          )}
        </div>
      </div>

      {/* Main Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Refund Value
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-1">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
              <span>{Number(refund.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Refund Request Type
            </span>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {refund.refundType?.replace('_', ' ')}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Gateway Refund ID
            </span>
            <p className="text-base font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              {refund.razorpayRefundId || 'Not processed yet'}
            </p>
          </div>
        </div>

        {/* Reason details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Stated Reason</h4>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {refund.reason?.replace('_', ' ')}
            </p>
          </div>

          {refund.description && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Notes</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {refund.description}
              </p>
            </div>
          )}

          {refund.adminNotes && (
            <div>
              <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Admin Resolution Notes</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60">
                {refund.adminNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Timeline */}
      <RefundTimeline refund={refund} />

      {/* Action Modal */}
      <RefundActionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, actionType: null })}
        actionType={modalState.actionType}
        refund={refund}
        onConfirm={handleActionConfirm}
        isPending={approving || rejecting || processing || retrying}
      />
    </div>
  );
}

export default AdminRefundDetailPage;
