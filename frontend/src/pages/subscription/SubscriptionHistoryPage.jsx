import React, { useState } from 'react';
import { useSubscriptionHistory } from '../../hooks/useSubscription.js';
import InvoiceCard from '../../components/subscription/InvoiceCard.jsx';
import { History, Receipt, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../../services/api.js';

export function SubscriptionHistoryPage() {
  const navigate = useNavigate();
  const { data: historyData, isLoading, error } = useSubscriptionHistory();
  const [downloadingId, setDownloadingId] = useState(null);

  // Ensure array
  const history = Array.isArray(historyData)
    ? historyData
    : Array.isArray(historyData?.invoices)
    ? historyData.invoices
    : Array.isArray(historyData?.payments)
    ? historyData.payments
    : Array.isArray(historyData?.history)
    ? historyData.history
    : Array.isArray(historyData?.data)
    ? historyData.data
    : [];

  const handleDownloadInvoice = async (invoice) => {
    const invoiceId = invoice?.id || invoice?._id;
    if (!invoiceId) {
      toast.error('Invalid invoice ID');
      return;
    }

    try {
      setDownloadingId(invoiceId);

      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Invoice downloaded successfully');
    } catch (err) {
      console.error('Download error:', err);
      toast.error(err.response?.data?.message || 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Billing & Invoice History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review past payments, invoice statements, and tax receipts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
          Failed to load billing history: {error.message}
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
            <History className="h-5 w-5 text-indigo-500" /> Transaction Statements ({history.length})
          </h2>
          <div className="space-y-3">
            {history.map((inv, idx) => (
              <InvoiceCard
                key={inv.id || inv._id || idx}
                invoice={inv}
                onDownload={handleDownloadInvoice}
                isDownloading={downloadingId === (inv.id || inv._id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionHistoryPage;

