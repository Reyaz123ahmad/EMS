import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

export const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles = user?.roles || [];
  const primaryRole = userRoles[0] || user?.role || 'EMPLOYEE';

  switch (primaryRole) {
    case 'SUPER_ADMIN':
      return <Navigate to="/dashboard/super-admin" replace />;
    case 'COMPANY_ADMIN':
      return <Navigate to="/dashboard/company-admin" replace />;
    case 'HR_ADMIN':
      return <Navigate to="/dashboard/hr-admin" replace />;
    case 'HR_MANAGER':
      return <Navigate to="/dashboard/hr-manager" replace />;
    case 'MANAGER':
      return <Navigate to="/dashboard/manager" replace />;
    case 'CLIENT':
      return <Navigate to="/dashboard/client" replace />;
    case 'EMPLOYEE':
    default:
      return <Navigate to="/dashboard/employee" replace />;
  }
};

export default RoleBasedRedirect;
