import React from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/auth.store';
import useNotificationStore from '../../store/notification.store';
import SidebarMenuItem from './SidebarMenuItem';
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
          {
            label: 'Platform Security',
            icon: ShieldAlert,
            children: [
              { label: 'Security Dashboard', to: '/security/dashboard' },
              { label: 'Security Events', to: '/security/events' },
              { label: 'Audit Logs', to: '/security/audit-logs' }
            ]
          },
          { label: 'Queue Monitor', to: '/admin/queues', icon: Cpu },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles }
        ];
      case 'COMPANY_ADMIN':
      case 'HR_ADMIN':
        return [
          { label: 'Dashboard', to: role === 'COMPANY_ADMIN' ? '/dashboard/company-admin' : '/dashboard/hr-admin', icon: LayoutDashboard },
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
              { label: 'Manual Entry', to: '/attendance/manual' }
            ]
          },
          {
            label: 'Emergency Check-in',
            icon: AlertOctagon,
            children: [
              { label: 'Submit Request', to: '/emergency-attendance' },
              { label: 'Pending Requests', to: '/emergency-attendance/requests' },
              { label: 'Emergency Stats', to: '/emergency-attendance/stats' }
            ]
          },
          {
            label: 'Approvals Engine',
            icon: CheckSquare,
            children: [
              { label: 'Workflows', to: '/approvals/workflows' },
              { label: 'Pending Requests', to: '/approvals/requests' },
              { label: 'Approval History', to: '/approvals/history' }
            ]
          },
          {
            label: 'Asset Management',
            icon: Package,
            children: [
              { label: 'Asset Inventory', to: '/assets' },
              { label: 'Assign Asset', to: '/assets/assign' },
              { label: 'Return Asset', to: '/assets/return' },
              { label: 'Categories', to: '/assets/categories' }
            ]
          },
          {
            label: 'Leave Management',
            icon: PlaneTakeoff,
            children: [
              { label: 'Apply Leave', to: '/leave/apply' },
              { label: 'Leave Requests', to: '/leave/requests' },
              { label: 'Leave Balances', to: '/leave/balance' },
              { label: 'Leave Calendar', to: '/leave/calendar' },
              { label: 'Leave History', to: '/leave/history' },
              { label: 'Leave Types', to: '/leave/types' }
            ]
          },
          {
            label: 'Payroll & CTC',
            icon: DollarSign,
            children: [
              { label: 'Salary Structure', to: '/payroll/salary-structure' },
              { label: 'Execute Run', to: '/payroll/run' },
              { label: 'Payroll Batches', to: '/payroll/runs' },
              { label: 'Salary Slips', to: '/payroll/slips' }
            ]
          },
          {
            label: 'Overtime',
            icon: Clock,
            children: [
              { label: 'Apply Overtime', to: '/overtime/apply' },
              { label: 'Overtime Requests', to: '/overtime/requests' },
              { label: 'Overtime Logs', to: '/overtime/records' },
              { label: 'Rules & Rates', to: '/overtime/rules' },
              { label: 'Analytics', to: '/overtime/stats' }
            ]
          },
          {
            label: 'Shifts & Rosters',
            icon: CalendarDays,
            children: [
              { label: 'My Shift', to: '/my-shift' },
              { label: 'Work Shifts', to: '/shifts' },
              { label: 'Create Shift', to: '/shifts/create' },
              { label: 'Assign Shifts', to: '/shifts/assign' },
              { label: 'Shift Rosters', to: '/rosters' },
              { label: 'Generate Roster', to: '/rosters/generate' },
              { label: 'Roster Calendar', to: '/rosters/calendar' }
            ]
          },
          {
            label: 'Holidays',
            icon: Calendar,
            children: [
              { label: 'Holiday Calendar', to: '/holidays' },
              { label: 'Holiday List', to: '/holidays/list' },
              { label: 'Holiday Allocation', to: '/holidays/assign' }
            ]
          },
          {
            label: 'Biometrics',
            icon: ShieldCheck,
            children: [
              { label: 'Face Registration', to: '/face-registration' },
              { label: 'Fingerprint Sync', to: '/finger-attendance' },
              { label: 'QR Badges', to: '/card-attendance' }
            ]
          },
          ...(role === 'COMPANY_ADMIN' ? [
            {
              label: 'Subscription',
              icon: CreditCard,
              children: [
                { label: 'Current Plan', to: '/subscription/current' },
                { label: 'Available Plans', to: '/subscription/plans' },
                { label: 'Billing History', to: '/subscription/history' }
              ]
            },
            {
              label: 'Payment Analytics',
              icon: TrendingUp,
              children: [
                { label: 'Revenue Dashboard', to: '/payment-analytics/revenue' },
                { label: 'Success Rate', to: '/payment-analytics/success-rate' },
                { label: 'Disputes & Refunds', to: '/payment-analytics/refunds' }
              ]
            },
            { label: 'Refunds', to: '/refunds', icon: RotateCcw }
          ] : []),
          {
            label: 'Advanced Security',
            icon: ShieldAlert,
            children: [
              { label: 'Security Dashboard', to: '/security/dashboard' },
              { label: 'Fraud Signals', to: '/security/fraud-signals' },
              { label: 'Security Events', to: '/security/events' },
              { label: 'Audit Logs', to: '/security/audit-logs' },
              { label: 'Blocked Employees', to: '/security/blocked-employees' }
            ]
          },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Reports', to: '/reports', icon: FileCheck2 },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'Company Settings', to: '/settings/general', icon: Settings }
        ];
      case 'HR_MANAGER':
        return [
          { label: 'Dashboard', to: '/dashboard/hr-manager', icon: LayoutDashboard },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles },
          { label: 'Employees', to: '/employees', icon: Users },
          {
            label: 'Attendance',
            icon: CalendarCheck,
            children: [
              { label: "Today's Status", to: '/attendance' },
              { label: 'Attendance Logs', to: '/attendance/logs' },
              { label: 'Calendar View', to: '/attendance/calendar' },
              { label: 'Exceptions', to: '/attendance/exceptions' }
            ]
          },
          {
            label: 'Emergency Check-in',
            icon: AlertOctagon,
            children: [
              { label: 'Submit Request', to: '/emergency-attendance' },
              { label: 'Pending Requests', to: '/emergency-attendance/requests' }
            ]
          },
          {
            label: 'Approvals',
            icon: CheckSquare,
            children: [
              { label: 'Pending Requests', to: '/approvals/requests' },
              { label: 'History', to: '/approvals/history' }
            ]
          },
          {
            label: 'Asset Inventory',
            icon: Package,
            to: '/assets'
          },
          {
            label: 'Leave',
            icon: PlaneTakeoff,
            children: [
              { label: 'Leave Requests', to: '/leave/requests' },
              { label: 'Team Calendar', to: '/leave/calendar' },
              { label: 'Apply Leave', to: '/leave/apply' }
            ]
          },
          {
            label: 'Overtime',
            icon: Clock,
            children: [
              { label: 'Overtime Requests', to: '/overtime/requests' },
              { label: 'Records', to: '/overtime/records' }
            ]
          },
          {
            label: 'Shifts & Rosters',
            icon: CalendarDays,
            children: [
              { label: 'My Shift', to: '/my-shift' },
              { label: 'Work Shifts', to: '/shifts' },
              { label: 'Assign Shifts', to: '/shifts/assign' },
              { label: 'Roster Calendar', to: '/rosters/calendar' }
            ]
          },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Reports', to: '/reports', icon: FileCheck2 },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null }
        ];
      case 'MANAGER':
        return [
          { label: 'Dashboard', to: '/dashboard/manager', icon: LayoutDashboard },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          { label: 'Team Members', to: '/employees', icon: Users },
          { label: 'Attendance Review', to: '/attendance/logs', icon: CalendarCheck },
          { label: 'Emergency Requests', to: '/emergency-attendance/requests', icon: AlertOctagon },
          { label: 'Approvals & Reviews', to: '/approvals/requests', icon: CheckSquare },
          { label: 'Leave Approvals', to: '/leave/requests', icon: PlaneTakeoff },
          { label: 'Overtime Approvals', to: '/overtime/requests', icon: Clock },
          { label: 'Roster Schedule', to: '/rosters/calendar', icon: CalendarDays },
          { label: 'Reports', to: '/reports', icon: FileCheck2 },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null }
        ];
      case 'CLIENT':
        return [
          { label: 'Dashboard', to: '/client-portal', icon: LayoutDashboard },
          { label: 'Projects', to: '/client-portal/projects', icon: Briefcase },
          { label: 'Requirements', to: '/client-portal/requirements', icon: FileText },
          { label: 'Invoices', to: '/client-portal/invoices', icon: DollarSign },
          { label: 'Discussions', to: '/client-portal/comments', icon: MessageSquare },
          { label: 'Payment History', to: '/client-portal/payments', icon: CreditCard },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null }
        ];
      case 'EMPLOYEE':
      default:
        return [
          { label: 'Dashboard', to: '/dashboard/employee', icon: LayoutDashboard },
          { label: 'AI Intelligence', to: '/ai/hub', icon: Sparkles },
          { label: 'My Shift', to: '/my-shift', icon: Clock },
          {
            label: 'Attendance',
            icon: CalendarCheck,
            children: [
              { label: 'Mark Attendance', to: '/attendance' },
              { label: 'My Logs', to: '/attendance/logs' },
              { label: 'My Calendar', to: '/attendance/calendar' }
            ]
          },
          {
            label: 'Emergency Attendance',
            icon: AlertOctagon,
            to: '/emergency-attendance'
          },
          {
            label: 'My Approvals',
            icon: CheckSquare,
            to: '/approvals/requests'
          },
          {
            label: 'My Assets',
            icon: Package,
            to: '/assets'
          },
          {
            label: 'My Leave',
            icon: PlaneTakeoff,
            children: [
              { label: 'Apply Leave', to: '/leave/apply' },
              { label: 'My Leave History', to: '/leave/history' },
              { label: 'Leave Balances', to: '/leave/balance' },
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
          { label: 'Roster Schedule', to: '/rosters/calendar', icon: CalendarDays },
          { label: 'Holiday Calendar', to: '/holidays', icon: Calendar },
          { label: 'Documents', to: '/documents', icon: FileText },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { label: 'My Profile', to: '/profile', icon: User }
        ];
    }
  };

  const menuItems = getMenuForRole(primaryRole);

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Logo & Brand */}
        <div className="flex items-center justify-between px-2">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              E
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  EMS Cloud
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Enterprise
                </span>
              </div>
            )}
          </Link>

          {setCollapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="space-y-1.5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
          {!collapsed && (
            <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Navigation
            </span>
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

      {/* Footer / Role indicator */}
      {!collapsed && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Connected
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Role: {primaryRole.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-300 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
