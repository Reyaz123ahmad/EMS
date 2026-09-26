import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/auth.store.js';
import useSubscriptionStore from '../../store/subscription.store.js';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const { isExpired } = useSubscriptionStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || user?.userRoles?.[0]?.role?.name;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const COMPANY_ONLY_ROUTES = [
    '/employees', '/attendance', '/leave', '/payroll', '/shifts', '/rosters',
    '/holidays', '/departments', '/designations', '/branches', '/documents',
    '/performance', '/tasks', '/projects', '/clients', '/onboarding',
    '/certificates', '/assets', '/emergency-attendance', '/approvals',
    '/biometric-devices', '/biometric-cards', '/overtime'
  ];

  if (isSuperAdmin) {
    const currentPath = location.pathname;
    const isCompanyOnly = COMPANY_ONLY_ROUTES.some(route =>
      currentPath.startsWith(route)
    );
    if (isCompanyOnly) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Role validation
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole) && !isSuperAdmin) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Subscription expiry check
  if (!isSuperAdmin && isExpired && location.pathname !== '/subscription-expired') {
    return <Navigate to="/subscription-expired" replace />;
  }

  return children;
}

export default ProtectedRoute;
