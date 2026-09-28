import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/auth.store.js';
import useSubscriptionStore from '../../store/subscription.store.js';

export function getDashboardForRole(role) {
  switch (role) {
    case 'SUPER_ADMIN': return '/dashboard/super-admin';
    case 'COMPANY_ADMIN': return '/dashboard/company-admin';
    case 'HR_ADMIN': return '/dashboard/hr-admin';
    case 'HR_MANAGER': return '/dashboard/hr-manager';
    case 'MANAGER': return '/dashboard/manager';
    case 'CLIENT': return '/dashboard/client';
    case 'EMPLOYEE':
    default:
      return '/dashboard/employee';
  }
}

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const { isExpired } = useSubscriptionStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || user?.roles?.[0] || user?.userRoles?.[0]?.role?.name || 'EMPLOYEE';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const currentPath = location.pathname;

  const COMPANY_ONLY_ROUTES = [
    '/employees', '/attendance', '/leave', '/payroll', '/shifts', '/rosters',
    '/holidays', '/departments', '/designations', '/branches', '/documents',
    '/performance', '/tasks', '/projects', '/clients', '/onboarding',
    '/certificates', '/assets', '/emergency-attendance', '/approvals',
    '/biometric-devices', '/biometric-cards', '/overtime',
    '/security/dashboard', '/security/events', '/security/audit-logs',
    '/security/fraud-signals', '/security/blocked-employees', '/security'
  ];

  if (isSuperAdmin) {
    const isCompanyOnly = COMPANY_ONLY_ROUTES.some(route =>
      currentPath.startsWith(route)
    );
    if (isCompanyOnly) {
      return <Navigate to="/dashboard/super-admin" replace />;
    }
  }

  // FIX 8 Route Guard Rules
  // /shifts/rosters -> HR_ADMIN, HR_MANAGER (and COMPANY_ADMIN, SUPER_ADMIN)
  if ((currentPath.startsWith('/shifts/rosters') || currentPath.startsWith('/rosters')) && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(userRole)) {
    return <Navigate to={getDashboardForRole(userRole)} replace />;
  }

  // /holidays -> HR_ADMIN, HR_MANAGER (and COMPANY_ADMIN, SUPER_ADMIN)
  if (currentPath.startsWith('/holidays') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(userRole)) {
    return <Navigate to={getDashboardForRole(userRole)} replace />;
  }

  // /payroll/run -> HR_ADMIN (and COMPANY_ADMIN, SUPER_ADMIN)
  if (currentPath.startsWith('/payroll/run') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'].includes(userRole)) {
    return <Navigate to={getDashboardForRole(userRole)} replace />;
  }

  // /reports -> HR_ADMIN, HR_MANAGER (and COMPANY_ADMIN, SUPER_ADMIN)
  if (currentPath.startsWith('/reports') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(userRole)) {
    return <Navigate to={getDashboardForRole(userRole)} replace />;
  }

  // /security/dashboard -> HR_ADMIN (and COMPANY_ADMIN, SUPER_ADMIN)
  if (currentPath.startsWith('/security') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'].includes(userRole)) {
    return <Navigate to={getDashboardForRole(userRole)} replace />;
  }

  // /settings/security -> COMPANY_ADMIN only
  if (currentPath.startsWith('/settings/security') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(userRole)) {
    return <Navigate to="/settings/general" replace />;
  }

  // /settings/* -> COMPANY_ADMIN and HR_ADMIN only (EMPLOYEE / others redirect to /profile)
  if (currentPath.startsWith('/settings') && 
      !['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN'].includes(userRole)) {
    return <Navigate to="/profile" replace />;
  }

  // Role validation
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRole) && !isSuperAdmin) {
      return <Navigate to={getDashboardForRole(userRole)} replace />;
    }
  }

  // Subscription expiry check
  if (!isSuperAdmin && isExpired && location.pathname !== '/subscription-expired') {
    return <Navigate to="/subscription-expired" replace />;
  }

  return children;
}

export default ProtectedRoute;
