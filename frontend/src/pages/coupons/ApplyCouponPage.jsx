import React, { useState } from 'react';
import { useValidateCoupon, useApplyCoupon } from '../../hooks/useCoupons.js';
import { Tag, CheckCircle2, AlertCircle, ArrowRight, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

export function ApplyCouponPage({ planId, originalAmount, onDiscountApplied }) {
  const [code, setCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);

  const { mutateAsync: validateCoupon, isPending: validating } = useValidateCoupon();
  const { mutateAsync: applyCoupon, isPending: applying } = useApplyCoupon();

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!code) return;
    try {
      const res = await validateCoupon({ code: code.trim().toUpperCase(), planId });
      setDiscountInfo(res);
      toast.success(`Coupon ${code.toUpperCase()} applied!`);
      if (onDiscountApplied) onDiscountApplied(res);
    } catch (err) {
      setDiscountInfo(null);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Have a Promo / Discount Code?
        </span>
      </div>

      <form onSubmit={handleValidate} className="flex gap-2">
        <input
          type="text"
          placeholder="ENTER CODE"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 px-3.5 py-2 uppercase font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={validating || !code}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
        >
          {validating ? 'Checking...' : 'Apply'}
        </button>
      </form>

      {discountInfo && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Discount Applied:</span>
          </div>
          <span className="font-bold">
            {discountInfo.discountType === 'PERCENTAGE'
              ? `${discountInfo.discountValue}% OFF`
              : `₹${discountInfo.discountValue} FLAT OFF`}
          </span>
        </div>
      )}
    </div>
  );
}

export default ApplyCouponPage;
