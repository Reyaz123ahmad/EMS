import React from 'react';
import useAuthStore from '../store/auth.store';
import SuperAdminDashboard from '../pages/dashboard/SuperAdminDashboard';
import CompanyAdminDashboard from '../pages/dashboard/CompanyAdminDashboard';
import HRAdminDashboard from '../pages/dashboard/HRAdminDashboard';
import HRManagerDashboard from '../pages/dashboard/HRManagerDashboard';
import ManagerDashboard from '../pages/dashboard/ManagerDashboard';
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard';
import ClientDashboard from '../pages/dashboard/ClientDashboard';

export const DashboardRouter = () => {
  const { user } = useAuthStore();
  const userRoles = user?.roles || [];
  const primaryRole = userRoles[0] || user?.role || 'EMPLOYEE';

  switch (primaryRole) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'COMPANY_ADMIN':
      return <CompanyAdminDashboard />;
    case 'HR_ADMIN':
      return <HRAdminDashboard />;
    case 'HR_MANAGER':
      return <HRManagerDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'CLIENT':
      return <ClientDashboard />;
    case 'EMPLOYEE':
    default:
      return <EmployeeDashboard />;
  }
};

export default DashboardRouter;
