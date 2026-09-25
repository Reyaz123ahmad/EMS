import React from 'react';
import { useSubscriptionHistory } from '../../hooks/useSubscription.js';
import InvoiceCard from '../../components/subscription/InvoiceCard.jsx';
import { History, Receipt, CreditCard, DownloadCloud } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionHistoryPage() {
  const { data: history = [], isLoading } = useSubscriptionHistory();

  const handleDownloadInvoice = (invoice) => {
    toast.success(`Downloading invoice ${invoice.invoiceNumber || invoice.id}...`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Billing & Invoice History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review past payments, invoice statements, and tax receipts.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 bg-white dark:bg-slate-900">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
            <Receipt className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Invoices Yet</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Payment transactions and downloadable GST invoices will appear here after your first billing cycle.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" /> Transaction Statements
          </h2>
          <div className="space-y-3">
            {history.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} onDownload={handleDownloadInvoice} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionHistoryPage;
