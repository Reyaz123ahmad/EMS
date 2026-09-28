import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import useNotificationStore from '../../store/notification.store';
import SidebarMenuItem from './SidebarMenuItem';
import Avatar from '../ui/Avatar';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  CreditCard,
  Camera,
  Fingerprint,
  Calendar,
  DollarSign,
  ShieldAlert,
  Settings,
  Bell,
  User,
  Briefcase,
  FileText,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  Clock,
  CalendarDays,
  PlaneTakeoff,
  Receipt,
  CheckSquare,
  Package,
  AlertOctagon,
  Cpu,
  RotateCcw,
  TrendingUp,
  Tag,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({
  collapsed = false,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const userRoles = user?.roles || ['EMPLOYEE'];
  const primaryRole = userRoles[0] || 'EMPLOYEE';

  const getMenuForRole = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { label: 'Dashboard', to: '/dashboard/super-admin', icon: LayoutDashboard },
          { label: 'Companies', to: '/companies', icon: Building2 },
          { label: 'Plans & Pricing', to: '/subscription/plans', icon: CreditCard },
          { label: 'Payments', to: '/payments', icon: DollarSign },
          { label: 'Invoices', to: '/invoices', icon: Receipt },
          { label: 'Refunds Management', to: '/admin/refunds', icon: RotateCcw },
          { label: 'Coupons & Promos', to: '/coupons', icon: Tag },
          {
            label: 'Payment Analytics',
            icon: TrendingUp,
            children: [
              { label: 'Revenue Dashboard', to: '/payment-analytics/revenue' },
              { label: 'Churn Analysis', to: '/payment-analytics/churn' },
              { label: 'Success Rate', to: '/payment-analytics/success-rate' },
              { label: 'Disputes & Refunds', to: '/payment-analytics/refunds' }
            ]
          },
          { label: 'Queue Monitor', to: '/admin/queues', icon: Cpu },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles }
        ];
      case 'HR_ADMIN':
        return [
          { label: 'Dashboard', to: '/dashboard/hr-admin', icon: LayoutDashboard },
          { label: 'Employees', to: '/employees', icon: Users },
          {
            label: 'Organization',
            icon: Building2,
            children: [
              { label: 'Branches', to: '/organization/branches' },
              { label: 'Departments', to: '/organization/departments' },
              { label: 'Designations', to: '/organization/designations' }
            ]
          },
          {
            label: 'Attendance',
            icon: CalendarCheck,
            children: [
              { label: "Today's Status", to: '/attendance' },
              { label: 'Attendance Logs', to: '/attendance/logs' },
              { label: 'Monthly Summary', to: '/attendance/monthly-summary' },
              { label: 'Calendar View', to: '/attendance/calendar' },
              { label: 'Exceptions', to: '/attendance/exceptions' }
            ]
          },
          {
            label: 'Leave Management',
            icon: PlaneTakeoff,
            children: [
              { label: 'Leave Requests', to: '/leave/requests' },
              { label: 'Leave Balances', to: '/leave/balances' },
              { label: 'Leave Types', to: '/leave/types' },
              { label: 'Leave Calendar', to: '/leave/calendar' }
            ]
          },
          { label: 'Overtime', to: '/overtime/records', icon: Clock },
          { label: 'Shifts', to: '/shifts', icon: Clock },
          { label: 'Rosters', to: '/shifts/rosters', icon: CalendarDays },
          { label: 'Holidays', to: '/holidays', icon: Calendar },
          {
            label: 'Payroll',
            icon: DollarSign,
            children: [
              { label: 'Payroll Runs', to: '/payroll/runs' },
              { label: 'Salary Slips', to: '/payroll/slips' },
              { label: 'Salary Structures', to: '/payroll/salary-structure' }
            ]
          },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Performance', to: '/performance', icon: Award },
          { label: 'Tasks', to: '/tasks', icon: CheckSquare },
          { label: 'Approvals', to: '/approvals/requests', icon: FileCheck2 },
          { label: 'Face Registration', to: '/face/register', icon: Camera },
          { label: 'Certificates', to: '/documents', icon: Award },
          { label: 'Onboarding', to: '/employees/create', icon: Users },
          { label: 'Assets', to: '/assets', icon: Package },
          { label: 'Reports', to: '/reports', icon: FileText },
          { label: 'Security (view)', to: '/security/dashboard', icon: ShieldAlert },
          { label: 'Settings (view)', to: '/settings/general', icon: Settings },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
      case 'COMPANY_ADMIN':
        return [
          { label: 'Dashboard', to: '/dashboard/company-admin', icon: LayoutDashboard },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles },
          { label: 'Employees', to: '/employees', icon: Users },
          {
            label: 'Organization',
            icon: Building2,
            children: [
              { label: 'Branches', to: '/organization/branches' },
              { label: 'Departments', to: '/organization/departments' },
              { label: 'Designations', to: '/organization/designations' }
            ]
          },
          {
            label: 'Attendance',
            icon: CalendarCheck,
            children: [
              { label: "Today's Status", to: '/attendance' },
              { label: 'Attendance Logs', to: '/attendance/logs' },
              { label: 'Monthly Summary', to: '/attendance/monthly-summary' },
              { label: 'Calendar View', to: '/attendance/calendar' },
              { label: 'Exceptions', to: '/attendance/exceptions' },
              { label: 'Overtime Tracker', to: '/attendance/overtime-tracker' },
              { label: 'Shift Roster', to: '/attendance/shift-roster' },
              { label: 'Attendance Fraud', to: '/attendance/fraud' },
              { label: 'QR Scanner', to: '/attendance/qr-scanner' },
              { label: 'Live Location Tracking', to: '/attendance/live-location' }

            ]
          },
          {
            label: 'Leave Management',
            icon: PlaneTakeoff,
            children: [
              { label: 'Leave Requests', to: '/leave/requests' },
              { label: 'Leave Balances', to: '/leave/balances' },
              { label: 'Leave Types', to: '/leave/types' },
              { label: 'Leave Calendar', to: '/leave/calendar' },
              { label: 'Balance Report', to: '/leave/report' }
            ]
          },
          {
            label: 'Payroll',
            icon: DollarSign,
            children: [
              { label: 'Payroll Runs', to: '/payroll/runs' },
              { label: 'Salary Structures', to: '/payroll/structures' },
              { label: 'Reimbursements', to: '/payroll/reimbursements' },
              { label: 'Loans & Advances', to: '/payroll/loans' },
              { label: 'Tax Slabs', to: '/payroll/tax-slabs' },
              { label: 'Analytics & Reports', to: '/payroll/analytics' }
            ]
          },
          { label: 'Projects & Tasks', to: '/projects', icon: Briefcase },
          { label: 'Clients', to: '/clients', icon: Users },
          { label: 'Tasks Board', to: '/tasks', icon: CheckSquare },
          { label: 'Asset Management', to: '/assets', icon: Package },
          { label: 'Subscription & Billing', to: '/subscription/current', icon: CreditCard },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Security & Audits', to: '/security/dashboard', icon: ShieldAlert },
          { label: 'Company Settings', to: '/settings/general', icon: Settings },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
      case 'HR_MANAGER':
        return [
          { label: 'Dashboard', to: '/dashboard/hr-manager', icon: LayoutDashboard },
          { label: 'Employees', to: '/employees', icon: Users },
          { label: 'Attendance', to: '/attendance', icon: CalendarCheck },
          { label: 'Leave', to: '/leave/requests', icon: PlaneTakeoff },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Performance', to: '/performance', icon: Award },
          { label: 'Tasks', to: '/tasks', icon: CheckSquare },
          { label: 'Approvals', to: '/approvals/requests', icon: FileCheck2 },
          { label: 'Assets', to: '/assets', icon: Package },
          { label: 'Reports', to: '/reports', icon: FileText },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
      case 'MANAGER':
        return [
          { label: 'Dashboard', to: '/dashboard/manager', icon: LayoutDashboard },
          { label: 'My Team', to: '/employees', icon: Users },
          { label: 'Team Attendance', to: '/attendance', icon: CalendarCheck },
          { label: 'Team Leave', to: '/leave/requests', icon: PlaneTakeoff },
          { label: 'Tasks', to: '/tasks', icon: CheckSquare },
          { label: 'Projects', to: '/projects', icon: Briefcase },
          { label: 'Team Performance', to: '/performance', icon: Award },
          { label: 'Approvals', to: '/approvals/requests', icon: FileCheck2 },
          { label: 'Assets', to: '/assets', icon: Package },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
      case 'CLIENT':
        return [
          { label: 'Dashboard', to: '/dashboard/client', icon: LayoutDashboard },
          { label: 'Projects', to: '/client-portal/projects', icon: Briefcase },
          { label: 'Requirements', to: '/client-portal/requirements', icon: FileCheck2 },
          { label: 'Comments', to: '/client-portal/comments', icon: MessageSquare },
          { label: 'Invoices', to: '/client-portal/invoices', icon: Receipt },
          { label: 'Payments', to: '/client-portal/payments', icon: DollarSign },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'Profile', to: '/profile', icon: User }
        ];
      case 'EMPLOYEE':
      default:
        return [
          { label: 'Dashboard', to: '/dashboard/employee', icon: LayoutDashboard },
          {
            label: 'Attendance & Punch',
            icon: Camera,
            children: [
              { label: 'Clock In / Out', to: '/attendance' },
              { label: 'My Attendance Logs', to: '/attendance/logs' },
              { label: 'Monthly Summary', to: '/attendance/monthly-summary' },
              { label: 'Attendance Calendar', to: '/attendance/calendar' },
              { label: 'QR Scanner', to: '/attendance/qr-scanner' }
            ]

          },
          { label: 'Emergency Attendance', icon: AlertOctagon, to: '/emergency-attendance' },
          { label: 'My Approvals', icon: CheckSquare, to: '/approvals/requests' },
          { label: 'My Assets', icon: Package, to: '/assets' },
          {
            label: 'My Leave',
            icon: PlaneTakeoff,
            children: [
              { label: 'My Leave', to: '/leave/my' },
              { label: 'Apply Leave', to: '/leave/apply' },
              { label: 'My Balance', to: '/leave/balances' },
              { label: 'Leave History', to: '/leave/history' },
              { label: 'Leave Calendar', to: '/leave/calendar' }
            ]
          },
          {
            label: 'My Overtime',
            icon: Clock,
            children: [
              { label: 'Claim Overtime', to: '/overtime/apply' },
              { label: 'My Records', to: '/overtime/records' }
            ]
          },
          { label: 'My Payslips', to: '/payroll/slips', icon: DollarSign },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
    }
  };

  const menuItems = getMenuForRole(primaryRole);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3">
      <div className="space-y-4">
        {/* Logo & Brand (56px / h-14) */}
        <div className="flex h-11 items-center justify-between px-2">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#111827] dark:bg-white flex items-center justify-center text-white dark:text-[#111827] font-bold text-sm">
              E
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold tracking-tight text-[#111827] dark:text-[#fafafa]">
                  EMS Platform
                </span>
                <span className="text-[10px] font-medium text-[#6b7280] dark:text-[#a3a3a3]">
                  Enterprise Suite
                </span>
              </div>
            )}
          </Link>

          {setCollapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded-md text-[#6b7280] hover:text-[#111827] dark:text-[#a3a3a3] dark:hover:text-white hover:bg-[#f3f4f6] dark:hover:bg-[#262626] transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1 max-h-[calc(100vh-160px)] overflow-y-auto pr-0.5">
          {!collapsed && (
            <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#9ca3af] dark:text-[#737373]">
              Menu
            </div>
          )}
          {menuItems.map((item, index) => (
            <SidebarMenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              to={item.to}
              badge={item.badge}
              children={item.children}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {/* Footer / User Profile */}
      {!collapsed && (
        <div className="rounded-xl border border-[#e5e7eb] dark:border-[#262626] bg-white dark:bg-[#171717] p-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user?.photoUrl || user?.employee?.photoUrl}
              name={user?.name || user?.email || 'User'}
              size="sm"
              status="online"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-medium text-[#111827] dark:text-[#fafafa] truncate">
                {user?.name || (user?.employee ? `${user.employee.firstName || ''} ${user.employee.lastName || ''}`.trim() : '') || user?.email?.split('@')[0] || 'Active User'}
              </span>
              <span className="text-[10px] text-[#6b7280] dark:text-[#a3a3a3] capitalize truncate">
                {primaryRole.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: 240px (w-60) or 64px (w-16) when collapsed */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#e5e7eb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#171717] transition-all duration-200 z-30 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 w-60 bg-[#fafafa] dark:bg-[#171717] border-r border-[#e5e7eb] dark:border-[#262626] z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
