import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSystemIssueRefund } from '../../hooks/useRefunds.js';
import { useCompany } from '../../hooks/useCompany.js';
import { ArrowLeft, Zap, IndianRupee, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function SystemIssueRefundPage() {
  const navigate = useNavigate();
  const { mutateAsync: systemIssueRefund, isPending } = useSystemIssueRefund();
  const { companies = [] } = useCompany();

  const [formData, setFormData] = useState({
    companyId: '',
    paymentId: '',
    amount: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyId) {
      toast.error('Please select a target company');
      return;
    }
    if (!formData.paymentId) {
      toast.error('Please provide a payment reference ID');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please specify a valid refund amount');
      return;
    }

    try {
      await systemIssueRefund({
        companyId: formData.companyId,
        paymentId: formData.paymentId,
        amount: Number(formData.amount),
        description: formData.description
      });
      navigate('/admin/refunds');
    } catch (err) {
      // toast in hook
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/refunds"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issue System-Level Refund</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Directly dispatches compensation to a tenant without requiring customer initiation.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Company Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Target Company <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.companyId}
            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">-- Choose Company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.companyCode ? `(${c.companyCode})` : ''} - {c.domain || c.email}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Transaction ID & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Transaction ID <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              required
              placeholder="e.g. pay_01..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Compensation Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Reason / Incident Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            System Incident / SLA Breach Notes
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Details on the outage, billing bug, or manual override reason..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
          <Zap className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-700 dark:text-purple-300">
            <strong>Immediate Gateway Trigger:</strong> System refunds are auto-approved and dispatched directly to the Razorpay gateway API. An audit log and email receipt will be immediately generated for the company admin.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/admin/refunds"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {isPending ? 'Processing Gateway Refund...' : 'Issue Immediate Refund'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SystemIssueRefundPage;
