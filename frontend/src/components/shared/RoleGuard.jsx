import React from 'react';
import useAuthStore from '../../store/auth.store.js';

export function RoleGuard({ allowedRoles = [], children, fallback = null }) {
  const { user } = useAuthStore();
  const userRole = user?.role || user?.userRoles?.[0]?.role?.name;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return fallback;
  }

  return children;
}

export default RoleGuard;
