import React from 'react';
import { Download, FileText, CheckCircle, Clock } from 'lucide-react';

export function InvoiceCard({ invoice, onDownload }) {
  const isPaid = invoice.status === 'PAID' || invoice.status === 'SUCCESS';

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              {invoice.invoiceNumber || `INV-${invoice.id?.slice(0, 8).toUpperCase()}`}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              }`}
            >
              {isPaid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {invoice.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Recent'} • ₹
            {Number(invoice.amount || invoice.total || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <button
        onClick={() => onDownload && onDownload(invoice)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        PDF
      </button>
    </div>
  );
}

export default InvoiceCard;
