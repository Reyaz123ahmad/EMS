import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCoupons } from '../../hooks/useCoupons.js';
import { ArrowLeft, Tag, Calendar, Percent, IndianRupee, Users, CheckCircle } from 'lucide-react';

export function CouponDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useCoupons();

  const coupon = data?.coupons?.find((c) => c.id === id || c.code === id);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading coupon details...</div>;
  }

  if (!coupon) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Coupon not found</h3>
        <Link to="/coupons" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
          Return to Coupons
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          to="/coupons"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coupon: {coupon.code}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Coupon ID: {coupon.id}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount Benefit</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Validity Range</span>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
              {new Date(coupon.validFrom).toLocaleDateString()} to {new Date(coupon.validTo).toLocaleDateString()}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redemption Usage</span>
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              {coupon.usedCount || 0} / {coupon.maxUses || 'Unlimited'}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Redemption Rules</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
            <li>Applicable to Starter, Pro, and Enterprise subscription renewals and upgrades.</li>
            <li>Limited to {coupon.maxUses || 100} total platform-wide redemptions.</li>
            <li>Can only be applied once per company billing cycle.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CouponDetailPage;
