import React from 'react';
import { useClientInvoices } from '../../hooks/useClientPortal.js';
import { FileText, Download, IndianRupee, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export function ClientInvoicesPage() {
  const { data, isLoading } = useClientInvoices();

  const invoices = data?.invoices || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Invoices & Billing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review generated tax invoices, payment dates, and download official PDF receipts.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No invoices on record</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official billing invoices will appear here once issued.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">PDF Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoiceNumber || `INV-${inv.id?.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4">
                      {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      ₹{Number(inv.amount || inv.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                        }`}
                      >
                        {inv.status || 'PAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={inv.pdfUrl || `http://localhost:5000/api/v1/invoices/${inv.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientInvoicesPage;
