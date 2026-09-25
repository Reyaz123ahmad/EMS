import React from 'react';
import { Link } from 'react-router-dom';
import RefundStatusBadge from './RefundStatusBadge.jsx';
import { IndianRupee, Calendar, ShieldAlert, ArrowRight, Building2 } from 'lucide-react';

export function RefundCard({ refund, isAdmin = false }) {
  const detailLink = isAdmin ? `/admin/refunds/${refund.id}` : `/refunds/${refund.id}`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all shadow-sm hover:shadow-md group">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
              #{refund.id?.slice(0, 8)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {refund.refundType?.replace('_', ' ')}
            </span>
          </div>

          {isAdmin && refund.payment?.company && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <span>{refund.payment.company.name}</span>
              {refund.payment.company.companyCode && (
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                  ({refund.payment.company.companyCode})
                </span>
              )}
            </div>
          )}

          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{Number(refund.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </h3>
        </div>

        <RefundStatusBadge status={refund.status} />
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(refund.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          <span className="truncate max-w-[200px]" title={refund.reason}>
            Reason: {refund.reason?.replace('_', ' ')}
          </span>
        </div>

        <Link
          to={detailLink}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
        >
          View Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default RefundCard;
