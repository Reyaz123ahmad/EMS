import React from 'react';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SubscriptionBanner({ daysRemaining, isExpired, planName }) {
  if (!isExpired && (daysRemaining === undefined || daysRemaining > 7)) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="bg-rose-500 text-white px-4 py-3 text-sm flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            <strong>Subscription Expired:</strong> Your access to premium HR operations is currently paused.
          </span>
        </div>
        <Link
          to="/subscription/renew"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-600 rounded-lg font-semibold text-xs shadow-sm hover:bg-rose-50 transition-colors"
        >
          Renew Now <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 text-sm flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          <strong>Subscription Notice:</strong> Your {planName || 'current'} plan expires in <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong>.
        </span>
      </div>
      <Link
        to="/subscription/renew"
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-amber-600 rounded-lg font-semibold text-xs shadow-sm hover:bg-amber-50 transition-colors"
      >
        Renew Early <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default SubscriptionBanner;
