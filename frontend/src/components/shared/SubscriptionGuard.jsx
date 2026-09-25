import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/auth.store.js';
import { useCheckExpiry } from '../../hooks/useSubscription.js';
import SubscriptionBanner from '../subscription/SubscriptionBanner.jsx';

export function SubscriptionGuard({ children }) {
  const { user } = useAuthStore();
  const companyId = user?.companyId || user?.company?.id;

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.userRoles?.[0]?.role?.name === 'SUPER_ADMIN';

  const { data: expiryRes } = useCheckExpiry(companyId, {
    enabled: Boolean(companyId) && !isSuperAdmin,
  });

  const expiryData = expiryRes?.data || {};
  const isExpired = expiryData.isExpired;
  const daysRemaining = expiryData.daysRemaining;

  if (!isSuperAdmin && isExpired) {
    return <Navigate to="/subscription-expired" replace />;
  }

  return (
    <>
      {!isSuperAdmin && daysRemaining !== undefined && daysRemaining <= 7 && !isExpired && (
        <SubscriptionBanner daysRemaining={daysRemaining} isExpired={false} />
      )}
      {children}
    </>
  );
}

export default SubscriptionGuard;
