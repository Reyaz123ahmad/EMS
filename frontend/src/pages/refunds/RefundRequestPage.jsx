import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRequestRefund } from '../../hooks/useRefunds.js';
import { useSubscriptionHistory } from '../../hooks/useSubscription.js';
import { ArrowLeft, Send, IndianRupee, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export function RefundRequestPage() {
  const navigate = useNavigate();
  const { data: history = [], isLoading: loadingHistory } = useSubscriptionHistory();
  const { mutateAsync: requestRefund, isPending } = useRequestRefund();

  const [formData, setFormData] = useState({
    paymentId: '',
    amount: '',
    reason: 'SERVICE_NOT_WORKING',
    refundType: 'CUSTOMER_REQUEST',
    description: ''
  });

  const selectedPayment = history.find((p) => p.id === formData.paymentId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.paymentId) {
      toast.error('Please select a payment transaction to refund');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    try {
      await requestRefund({
        paymentId: formData.paymentId,
        amount: Number(formData.amount),
        reason: formData.reason,
        refundType: formData.refundType,
        description: formData.description
      });
      navigate('/refunds');
    } catch (err) {
      // toast is already triggered by hook
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          to="/refunds"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Request a Refund</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submit a formal refund request for a past subscription payment.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Payment Transaction Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Select Payment Transaction <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.paymentId}
            onChange={(e) => {
              const pid = e.target.value;
              const payment = history.find((p) => p.id === pid);
              setFormData({
                ...formData,
                paymentId: pid,
                amount: payment ? payment.amount : ''
              });
            }}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Choose past payment --</option>
            {history.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id?.slice(0, 8)} • ₹{Number(item.amount).toLocaleString('en-IN')} • {new Date(item.createdAt).toLocaleDateString()} ({item.status})
              </option>
            ))}
          </select>
          {selectedPayment && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
              Maximum refundable amount for this payment: ₹{Number(selectedPayment.amount).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        {/* Amount & Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Refund Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={selectedPayment ? selectedPayment.amount : undefined}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Refund <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="SERVICE_NOT_WORKING">Service / Feature Not Working</option>
              <option value="BILLING_ERROR">Billing / Charge Calculation Error</option>
              <option value="DUPLICATE_CHARGE">Duplicate / Accidental Payment</option>
              <option value="SYSTEM_ISSUE">System Outage / Data Loss</option>
              <option value="OTHER">Other Reason</option>
            </select>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Detailed Explanation & Context
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Please share more details to help our team review and expedite your refund request..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Once submitted, your request will be reviewed by our finance team within 24-48 hours. Upon approval, funds will be refunded to your original payment method.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/refunds"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Submitting...' : 'Submit Refund Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RefundRequestPage;
