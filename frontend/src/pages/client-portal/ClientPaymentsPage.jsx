import React from 'react';
import { useClientPayments } from '../../hooks/useClientPortal.js';
import { CreditCard, IndianRupee, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export function ClientPaymentsPage() {
  const { data, isLoading } = useClientPayments();

  const payments = data?.payments || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Payment History</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete ledger of verified transactions, payment methods, and timestamps.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400">Loading payment history...</div>
      ) : payments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center">
          <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No payment transactions found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Completed payments will be automatically cataloged here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Transaction ID</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      #{p.id?.slice(0, 10)}
                    </td>
                    <td className="px-6 py-4">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 uppercase">
                      {p.paymentMethod || 'UPI / Razorpay'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                        {p.status || 'SUCCESS'}
                      </span>
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

export default ClientPaymentsPage;
