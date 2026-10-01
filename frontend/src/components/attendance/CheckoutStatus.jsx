import React from 'react';
import { FiClock, FiCheckCircle, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { useCheckoutStatus } from '../../hooks/useAttendance.js';

export function CheckoutStatus({ employeeId, onCheckoutClick, isCheckingOut = false }) {
  const { data: checkoutData, isLoading } = useCheckoutStatus(employeeId ? { employeeId } : {});
  const status = checkoutData?.data || {};

  const {
    canCheckout = false,
    remainingMinutes = 0,
    expectedCheckoutTime = null,
    actualMinutes = 0,
    requiredMinutes = 0,
    reason = ''
  } = status;

  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl animate-pulse flex items-center justify-between">
        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
        <div className="h-8 bg-slate-700 rounded w-24"></div>
      </div>
    );
  }

  const formatMins = (mins) => {
    const h = Math.floor((mins || 0) / 60);
    const m = (mins || 0) % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const formattedExpectedTime = expectedCheckoutTime
    ? new Date(expectedCheckoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const targetMinutes = requiredMinutes || (actualMinutes > 0 ? actualMinutes : 480);
  const progressPercent = Math.min(100, Math.round((actualMinutes / (targetMinutes || 1)) * 100));

  return (
    <div className="p-5 bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FiClock className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-semibold text-slate-200">Shift Working Hours</span>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
            canCheckout
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {canCheckout ? (
            <>
              <FiCheckCircle className="w-3.5 h-3.5" /> Full Time Met
            </>
          ) : (
            <>
              <FiAlertTriangle className="w-3.5 h-3.5" /> In Progress
            </>
          )}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>Worked: {formatMins(actualMinutes)}</span>
          <span>Required: {formatMins(requiredMinutes)}</span>
        </div>
        <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
          <p className="text-slate-400">Earliest Checkout</p>
          <p className="text-sm font-bold text-slate-100 mt-0.5">{formattedExpectedTime}</p>
        </div>
        <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/40">
          <p className="text-slate-400">Remaining Time</p>
          <p className="text-sm font-bold text-amber-400 mt-0.5">
            {remainingMinutes > 0 ? formatMins(remainingMinutes) : '0m (Completed)'}
          </p>
        </div>
      </div>

      {/* Action Button / Disable reason */}
      {onCheckoutClick && (
        <div>
          <button
            onClick={onCheckoutClick}
            disabled={!canCheckout || isCheckingOut}
            className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${
              canCheckout
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
            }`}
          >
            {!canCheckout && <FiLock className="w-4 h-4" />}
            {isCheckingOut ? 'Checking Out...' : canCheckout ? 'Check Out Now' : 'Checkout Disabled (Work Full Hours)'}
          </button>
          {!canCheckout && reason && (
            <p className="text-[11px] text-amber-400/90 text-center mt-2 leading-relaxed">
              {reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckoutStatus;
