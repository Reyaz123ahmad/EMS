import React from 'react';

const statusConfig = {
  PENDING: {
    label: 'Pending Approval',
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    dot: 'bg-amber-500'
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    dot: 'bg-blue-500'
  },
  PROCESSED: {
    label: 'Processed & Settled',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    dot: 'bg-emerald-500'
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
    dot: 'bg-rose-500'
  },
  FAILED: {
    label: 'Processing Failed',
    bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60',
    dot: 'bg-red-500'
  }
};

export function RefundStatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default RefundStatusBadge;
