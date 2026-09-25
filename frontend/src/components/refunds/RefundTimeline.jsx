import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ArrowDown } from 'lucide-react';

export function RefundTimeline({ refund }) {
  const steps = [
    {
      title: 'Refund Requested',
      description: `Requested via ${refund.refundType?.replace('_', ' ')}`,
      time: refund.createdAt ? new Date(refund.createdAt).toLocaleString('en-IN') : null,
      status: 'completed',
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
    },
    {
      title: refund.status === 'REJECTED' ? 'Refund Rejected' : 'Admin Review & Approval',
      description:
        refund.status === 'REJECTED'
          ? `Reason: ${refund.rejectionReason || 'Policy check failed'}`
          : refund.status === 'PENDING'
          ? 'Under verification by Super Admin'
          : `Approved ${refund.adminNotes ? `(${refund.adminNotes})` : ''}`,
      time: refund.status !== 'PENDING' ? new Date(refund.updatedAt).toLocaleString('en-IN') : null,
      status:
        refund.status === 'REJECTED'
          ? 'rejected'
          : refund.status === 'PENDING'
          ? 'current'
          : 'completed',
      icon:
        refund.status === 'REJECTED'
          ? XCircle
          : refund.status === 'PENDING'
          ? Clock
          : CheckCircle2,
      color:
        refund.status === 'REJECTED'
          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
          : refund.status === 'PENDING'
          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
          : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
    },
    {
      title: 'Payment Gateway Settlement',
      description:
        refund.status === 'PROCESSED'
          ? `Transferred via Razorpay (Refund ID: ${refund.razorpayRefundId || 'SIMULATED'})`
          : refund.status === 'FAILED'
          ? 'Failed during gateway dispatch'
          : refund.status === 'REJECTED'
          ? 'Cancelled due to rejection'
          : 'Pending dispatch after approval',
      time: refund.processedAt ? new Date(refund.processedAt).toLocaleString('en-IN') : null,
      status:
        refund.status === 'PROCESSED'
          ? 'completed'
          : refund.status === 'FAILED'
          ? 'rejected'
          : refund.status === 'APPROVED'
          ? 'current'
          : 'upcoming',
      icon:
        refund.status === 'PROCESSED'
          ? CheckCircle2
          : refund.status === 'FAILED'
          ? AlertTriangle
          : Clock,
      color:
        refund.status === 'PROCESSED'
          ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
          : refund.status === 'FAILED'
          ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
          : 'text-slate-400 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
        Refund Lifecycle & Timeline
      </h3>

      <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="relative group">
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center border ${step.color} shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="ml-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                  {step.time && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {step.time}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RefundTimeline;
