import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { useSubscriptionStore } from '../../store/subscription.store.js';

export function SubscriptionBanner() {
  const { isExpired, daysRemaining, plan } = useSubscriptionStore();

  if (!isExpired && daysRemaining > 14) {
    return null;
  }

  const isCritical = isExpired || daysRemaining <= 3;
  const isWarning = daysRemaining > 3 && daysRemaining <= 14;

  const bgClasses = isCritical
    ? 'bg-red-950/80 border-red-800/80 text-red-200'
    : 'bg-amber-950/80 border-amber-800/80 text-amber-200';

  const iconColor = isCritical ? 'text-red-400' : 'text-amber-400';

  return (
    <div className={`flex items-center justify-between border-b px-6 py-2.5 text-xs backdrop-blur-md transition-all ${bgClasses}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 shrink-0 ${iconColor}`} />
        <span>
          {isExpired ? (
            <strong>Your company subscription has expired. Please renew to avoid service interruptions.</strong>
          ) : (
            <span>
              Your <strong>{plan?.name || 'Pro'}</strong> plan will expire in <strong>{daysRemaining} days</strong>.
            </span>
          )}
        </span>
      </div>

      <Link
        to="/subscription-expired"
        className="inline-flex items-center gap-1 font-semibold underline hover:opacity-80 transition-opacity"
      >
        Renew Now <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default SubscriptionBanner;
