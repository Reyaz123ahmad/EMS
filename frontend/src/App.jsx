import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import TwoFactorPage from './pages/auth/TwoFactorPage.jsx';
import UnauthorizedPage from './pages/UnauthorizedPage.jsx';
import SubscriptionExpiredPage from './pages/subscription/SubscriptionExpiredPage.jsx';
import LiveLocationPage from './pages/LiveLocationPage.jsx';

import DashboardLayout from './layouts/DashboardLayout.jsx';
import DashboardRouter from './routes/DashboardRouter.jsx';

// 7 Role-Based Dashboards
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard.jsx';
import CompanyAdminDashboard from './pages/dashboard/CompanyAdminDashboard.jsx';
import HRAdminDashboard from './pages/dashboard/HRAdminDashboard.jsx';
import HRManagerDashboard from './pages/dashboard/HRManagerDashboard.jsx';
import ManagerDashboard from './pages/dashboard/ManagerDashboard.jsx';
import EmployeeDashboard from './pages/dashboard/EmployeeDashboard.jsx';
import ClientDashboard from './pages/dashboard/ClientDashboard.jsx';

// AI Subsystem
import AIHubPage from './pages/ai/AIHubPage.jsx';
import AIChatbotWidget from './components/ai/AIChatbotWidget.jsx';

// Notifications
import NotificationsPage from './pages/notifications/NotificationsPage.jsx';

// Profile Pages
import ProfilePage from './pages/profile/ProfilePage.jsx';
import ChangePasswordPage from './pages/profile/ChangePasswordPage.jsx';
import TwoFactorSetupPage from './pages/profile/TwoFactorSetupPage.jsx';

// Settings Pages
import SettingsLayout from './pages/settings/SettingsLayout.jsx';
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage.jsx';
import AttendanceSettingsPage from './pages/settings/AttendanceSettingsPage.jsx';
import SecuritySettingsPage from './pages/settings/SecuritySettingsPage.jsx';
import LeaveSettingsPage from './pages/settings/LeaveSettingsPage.jsx';
import PayrollSettingsPage from './pages/settings/PayrollSettingsPage.jsx';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage.jsx';

// Company Module Pages
import CompanyListPage from './pages/companies/CompanyListPage.jsx';
import CreateCompanyPage from './pages/companies/CreateCompanyPage.jsx';
import CompanyDetailPage from './pages/companies/CompanyDetailPage.jsx';
import CompanySettingsPage from './pages/companies/CompanySettingsPage.jsx';

// Employee Module Pages
import EmployeeListPage from './pages/employees/EmployeeListPage.jsx';
import CreateEmployeePage from './pages/employees/CreateEmployeePage.jsx';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage.jsx';
import EditEmployeePage from './pages/employees/EditEmployeePage.jsx';
import BulkImportEmployeesPage from './pages/employees/BulkImportEmployeesPage.jsx';

// Organization Module Pages
import BranchListPage from './pages/organization/BranchListPage.jsx';
import BranchDetailPage from './pages/organization/BranchDetailPage.jsx';
import DepartmentListPage from './pages/organization/DepartmentListPage.jsx';
import DepartmentDetailPage from './pages/organization/DepartmentDetailPage.jsx';
import DesignationListPage from './pages/organization/DesignationListPage.jsx';
import DesignationDetailPage from './pages/organization/DesignationDetailPage.jsx';

// Document Management Pages
import DocumentListPage from './pages/documents/DocumentListPage.jsx';
import DocumentUploadPage from './pages/documents/DocumentUploadPage.jsx';
import AadhaarUploadPage from './pages/documents/AadhaarUploadPage.jsx';
import DocumentDetailPage from './pages/documents/DocumentDetailPage.jsx';

// Reports Module Pages
import ReportsPage from './pages/reports/ReportsPage.jsx';
import ReportHistoryPage from './pages/reports/ReportHistoryPage.jsx';

// Attendance Module Pages
import AttendancePage from './pages/attendance/AttendancePage.jsx';
import AttendanceLogsPage from './pages/attendance/AttendanceLogsPage.jsx';
import MonthlySummaryPage from './pages/attendance/MonthlySummaryPage.jsx';
import AttendanceStatsPage from './pages/attendance/AttendanceStatsPage.jsx';
import AttendanceCalendarPage from './pages/attendance/AttendanceCalendarPage.jsx';
import AttendanceExceptionsPage from './pages/attendance/AttendanceExceptionsPage.jsx';
import ManualAttendancePage from './pages/attendance/ManualAttendancePage.jsx';

// Leave Management Module Pages
import LeaveTypesPage from './pages/leave/LeaveTypesPage.jsx';
import LeaveBalancePage from './pages/leave/LeaveBalancePage.jsx';
import ApplyLeavePage from './pages/leave/ApplyLeavePage.jsx';
import LeaveRequestsPage from './pages/leave/LeaveRequestsPage.jsx';
import LeaveCalendarPage from './pages/leave/LeaveCalendarPage.jsx';
import LeaveHistoryPage from './pages/leave/LeaveHistoryPage.jsx';
import MyLeavePage from './pages/leave/MyLeavePage.jsx';

// Payroll Module Pages
import SalaryStructurePage from './pages/payroll/SalaryStructurePage.jsx';
import PayrollRunPage from './pages/payroll/PayrollRunPage.jsx';
import PayrollRunsListPage from './pages/payroll/PayrollRunsListPage.jsx';
import PayrollDetailPage from './pages/payroll/PayrollDetailPage.jsx';
import SalarySlipsPage from './pages/payroll/SalarySlipsPage.jsx';
import EmployeeSalaryPage from './pages/payroll/EmployeeSalaryPage.jsx';

// Overtime Module Pages
import OvertimeRulesPage from './pages/overtime/OvertimeRulesPage.jsx';
import OvertimeRecordsPage from './pages/overtime/OvertimeRecordsPage.jsx';
import ApplyOvertimePage from './pages/overtime/ApplyOvertimePage.jsx';
import OvertimeRequestsPage from './pages/overtime/OvertimeRequestsPage.jsx';
import OvertimeStatsPage from './pages/overtime/OvertimeStatsPage.jsx';

// Shift & Roster Module Pages
import ShiftListPage from './pages/shifts/ShiftListPage.jsx';
import CreateShiftPage from './pages/shifts/CreateShiftPage.jsx';
import ShiftDetailPage from './pages/shifts/ShiftDetailPage.jsx';
import AssignShiftPage from './pages/shifts/AssignShiftPage.jsx';
import MyShiftPage from './pages/shifts/MyShiftPage.jsx';
import RosterListPage from './pages/shifts/RosterListPage.jsx';
import GenerateRosterPage from './pages/shifts/GenerateRosterPage.jsx';
import RosterCalendarPage from './pages/shifts/RosterCalendarPage.jsx';

// Holiday Calendar Module Pages
import HolidayCalendarPage from './pages/holidays/HolidayCalendarPage.jsx';
import HolidayListPage from './pages/holidays/HolidayListPage.jsx';
import HolidayAssignmentPage from './pages/holidays/HolidayAssignmentPage.jsx';

// Biometrics & Badges Pages
import CardListPage from './pages/biometric/CardListPage.jsx';
import CardDetailPage from './pages/biometric/CardDetailPage.jsx';
import GenerateCardPage from './pages/biometric/GenerateCardPage.jsx';
import DeviceListPage from './pages/biometric/DeviceListPage.jsx';
import DeviceDetailPage from './pages/biometric/DeviceDetailPage.jsx';
import VerifyQRPage from './pages/VerifyQRPage.jsx';

// Face Registration Module Pages
import FaceRegisterPage from './pages/face/RegisterFacePage.jsx';
import BulkRegisterFacePage from './pages/face/BulkRegisterFacePage.jsx';
import FaceStatusPage from './pages/face/FaceStatusPage.jsx';
import FaceRegistrationStatusPage from './pages/face/FaceRegistrationStatusPage.jsx';
import FaceApprovalsPage from './pages/face/FaceApprovalsPage.jsx';
import FaceStatsPage from './pages/face/FaceStatsPage.jsx';

// Finger Attendance Module Pages
import FingerEnrollmentPage from './pages/finger/FingerEnrollmentPage.jsx';
import FingerDevicePage from './pages/finger/FingerDevicePage.jsx';
import FingerPunchesPage from './pages/finger/FingerPunchesPage.jsx';

// Subscription Module Pages
import PlansPage from './pages/subscription/PlansPage.jsx';
import CurrentSubscriptionPage from './pages/subscription/CurrentSubscriptionPage.jsx';
import UpgradeSubscriptionPage from './pages/subscription/UpgradeSubscriptionPage.jsx';
import SubscriptionHistoryPage from './pages/subscription/SubscriptionHistoryPage.jsx';
import RenewSubscriptionPage from './pages/subscription/RenewSubscriptionPage.jsx';
import PaymentsPage from './pages/payments/PaymentsPage.jsx';
import InvoicesPage from './pages/invoices/InvoicesPage.jsx';

// Advanced Security Module Pages
import SecurityDashboardPage from './pages/security/SecurityDashboardPage.jsx';
import FraudSignalsPage from './pages/security/FraudSignalsPage.jsx';
import SecurityEventsPage from './pages/security/SecurityEventsPage.jsx';
import AuditLogsPage from './pages/security/AuditLogsPage.jsx';
import BlockedEmployeesPage from './pages/security/BlockedEmployeesPage.jsx';

// Approvals Module Pages
import WorkflowsPage from './pages/approvals/WorkflowsPage.jsx';
import WorkflowDetailPage from './pages/approvals/WorkflowDetailPage.jsx';
import ApprovalRequestsPage from './pages/approvals/ApprovalRequestsPage.jsx';
import ApprovalHistoryPage from './pages/approvals/ApprovalHistoryPage.jsx';

// Assets Module Pages
import AssetListPage from './pages/assets/AssetListPage.jsx';
import CreateAssetPage from './pages/assets/CreateAssetPage.jsx';
import AssetDetailPage from './pages/assets/AssetDetailPage.jsx';
import AssignAssetPage from './pages/assets/AssignAssetPage.jsx';
import ReturnAssetPage from './pages/assets/ReturnAssetPage.jsx';
import AssetCategoriesPage from './pages/assets/AssetCategoriesPage.jsx';

// Emergency Attendance Module Pages
import EmergencyAttendancePage from './pages/emergency-attendance/EmergencyAttendancePage.jsx';
import EmergencyRequestsPage from './pages/emergency-attendance/EmergencyRequestsPage.jsx';
import EmergencyStatsPage from './pages/emergency-attendance/EmergencyStatsPage.jsx';

// Queue Monitor Pages
import QueueMonitorPage from './pages/admin/QueueMonitorPage.jsx';
import QueueDetailPage from './pages/admin/QueueDetailPage.jsx';

// Phase 5B - Refunds Module Pages
import RefundRequestPage from './pages/refunds/RefundRequestPage.jsx';
import RefundListPage from './pages/refunds/RefundListPage.jsx';
import RefundDetailPage from './pages/refunds/RefundDetailPage.jsx';
import AdminRefundListPage from './pages/refunds/AdminRefundListPage.jsx';
import AdminRefundDetailPage from './pages/refunds/AdminRefundDetailPage.jsx';
import SystemIssueRefundPage from './pages/refunds/SystemIssueRefundPage.jsx';

// Phase 5B - Payment Analytics Module Pages
import RevenueDashboardPage from './pages/payment-analytics/RevenueDashboardPage.jsx';
import ChurnAnalysisPage from './pages/payment-analytics/ChurnAnalysisPage.jsx';
import PaymentSuccessPage from './pages/payment-analytics/PaymentSuccessPage.jsx';
import RefundAnalyticsPage from './pages/payment-analytics/RefundAnalyticsPage.jsx';

// Phase 5B - Coupons Module Pages
import CouponListPage from './pages/coupons/CouponListPage.jsx';
import CouponDetailPage from './pages/coupons/CouponDetailPage.jsx';

// Phase 5B - Client Portal Pages
import ClientDashboardPage from './pages/client-portal/ClientDashboardPage.jsx';
import ClientProjectsPage from './pages/client-portal/ClientProjectsPage.jsx';
import ClientProjectDetailPage from './pages/client-portal/ClientProjectDetailPage.jsx';
import ClientRequirementsPage from './pages/client-portal/ClientRequirementsPage.jsx';
import ClientCommentsPage from './pages/client-portal/ClientCommentsPage.jsx';
import ClientInvoicesPage from './pages/client-portal/ClientInvoicesPage.jsx';
import ClientPaymentsPage from './pages/client-portal/ClientPaymentsPage.jsx';
import { useQuery } from '@tanstack/react-query';
import useAuthStore from './store/auth.store.js';
import authService from './services/auth.service.js';

import ProtectedRoute from './components/shared/ProtectedRoute.jsx';

export default function App() {
  const { isAuthenticated, updateUser } = useAuthStore();

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
    enabled: Boolean(isAuthenticated),
    staleTime: 5 * 60 * 1000
  });

  React.useEffect(() => {
    if (meData?.user) {
      updateUser(meData.user);
    } else if (meData?.id) {
      updateUser(meData);
    }
  }, [meData, updateUser]);

  return (
    <>
    <Routes>
      {/* Public Home Page & QR Verification */}
      <Route path="/" element={<HomePage />} />
      <Route path="/verify-qr" element={<VerifyQRPage />} />

      {/* Authentication Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
      </Route>

      {/* Standalone Status & Utility Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />
      <Route path="/live-location" element={<LiveLocationPage />} />

      {/* Protected Dashboard & Operations Pages */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role-Based Master Dashboard */}
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* 7 Dedicated Role Dashboard Routes */}
        <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/dashboard/company-admin" element={<CompanyAdminDashboard />} />
        <Route path="/dashboard/hr-admin" element={<HRAdminDashboard />} />
        <Route path="/dashboard/hr-manager" element={<HRManagerDashboard />} />
        <Route path="/dashboard/manager" element={<ManagerDashboard />} />
        <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
        <Route path="/dashboard/client" element={<ClientDashboard />} />

        {/* Queue Monitor Routes */}
        <Route path="/admin/queues" element={<QueueMonitorPage />} />
        <Route path="/admin/queues/:queue" element={<QueueDetailPage />} />
        <Route path="/dashboard/queues" element={<QueueMonitorPage />} />

        {/* Notifications Page */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Profile Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile/2fa" element={<TwoFactorSetupPage />} />

        {/* Subscription & Billing Routes */}
        <Route path="/subscription/plans" element={<PlansPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/subscription/current" element={<CurrentSubscriptionPage />} />
        <Route path="/subscription/upgrade" element={<UpgradeSubscriptionPage />} />
        <Route path="/subscription/history" element={<SubscriptionHistoryPage />} />
        <Route path="/subscription/renew" element={<RenewSubscriptionPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />

        {/* Settings Routes */}
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="/settings/general" replace />} />
          <Route path="general" element={<GeneralSettingsPage />} />
          <Route path="attendance" element={<AttendanceSettingsPage />} />
          <Route path="security" element={<SecuritySettingsPage />} />
          <Route path="leave" element={<LeaveSettingsPage />} />
          <Route path="payroll" element={<PayrollSettingsPage />} />
          <Route path="notifications" element={<NotificationSettingsPage />} />
        </Route>

        {/* Company Routes */}
        <Route path="/companies" element={<CompanyListPage />} />
        <Route path="/companies/create" element={<CreateCompanyPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/companies/:id/settings" element={<CompanySettingsPage />} />

        {/* Employee Routes */}
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/create" element={<CreateEmployeePage />} />
        <Route path="/employees/bulk-import" element={<BulkImportEmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
        <Route path="/employees/:id/face" element={<FaceRegisterPage />} />

        {/* Organization Routes */}
        <Route path="/organization/branches" element={<BranchListPage />} />
        <Route path="/organization/branches/:id" element={<BranchDetailPage />} />
        <Route path="/organization/departments" element={<DepartmentListPage />} />
        <Route path="/organization/departments/:id" element={<DepartmentDetailPage />} />
        <Route path="/organization/designations" element={<DesignationListPage />} />
        <Route path="/organization/designations/:id" element={<DesignationDetailPage />} />

        {/* Document Management Routes */}
        <Route path="/documents" element={<DocumentListPage />} />
        <Route path="/documents/my" element={<DocumentListPage />} />
        <Route path="/employee-documents" element={<DocumentListPage />} />
        <Route path="/employee-documents/my" element={<DocumentListPage />} />
        <Route path="/documents/upload" element={<DocumentUploadPage />} />
        <Route path="/documents/aadhaar/upload" element={<AadhaarUploadPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />

        {/* Reports & Analytics Routes */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/history" element={<ReportHistoryPage />} />

        {/* Attendance Module Routes */}
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/logs" element={<AttendanceLogsPage />} />
        <Route path="/attendance/my-logs" element={<AttendanceLogsPage />} />
        <Route path="/attendance/monthly-summary" element={<MonthlySummaryPage />} />
        <Route path="/attendance/my-summary" element={<MonthlySummaryPage />} />
        <Route path="/attendance/calendar" element={<AttendanceCalendarPage />} />
        <Route path="/attendance/exceptions" element={<AttendanceExceptionsPage />} />
        <Route path="/attendance/manual" element={<ManualAttendancePage />} />
        <Route path="/attendance/stats" element={<AttendanceStatsPage />} />

        {/* Leave Management Routes */}
        <Route path="/leave/types" element={<LeaveTypesPage />} />
        <Route path="/leave/balance" element={<LeaveBalancePage />} />
        <Route path="/leave/balances" element={<LeaveBalancePage />} />
        <Route path="/leave/apply" element={<ApplyLeavePage />} />
        <Route path="/leave/requests" element={<LeaveRequestsPage />} />
        <Route path="/leave/calendar" element={<LeaveCalendarPage />} />
        <Route path="/leave/history" element={<LeaveHistoryPage />} />
        <Route path="/leave/my" element={<MyLeavePage />} />

        {/* Payroll Routes */}
        <Route path="/payroll/salary-structure" element={<SalaryStructurePage />} />
        <Route path="/payroll/run" element={<PayrollRunPage />} />
        <Route path="/payroll/runs" element={<PayrollRunsListPage />} />
        <Route path="/payroll/batches" element={<PayrollRunsListPage />} />
        <Route path="/payroll/runs/:id" element={<PayrollDetailPage />} />
        <Route path="/payroll/slips" element={<SalarySlipsPage />} />
        <Route path="/payroll/employee/:id" element={<EmployeeSalaryPage />} />

        {/* Overtime Routes */}
        <Route path="/overtime/rules" element={<OvertimeRulesPage />} />
        <Route path="/overtime/records" element={<OvertimeRecordsPage />} />
        <Route path="/overtime/my" element={<OvertimeRecordsPage />} />
        <Route path="/overtime/apply" element={<ApplyOvertimePage />} />
        <Route path="/overtime/requests" element={<OvertimeRequestsPage />} />
        <Route path="/overtime/stats" element={<OvertimeStatsPage />} />
        <Route path="/overtime/analytics" element={<OvertimeStatsPage />} />

        {/* Shift & Roster Routes */}
        <Route path="/shifts" element={<ShiftListPage />} />
        <Route path="/shifts/create" element={<CreateShiftPage />} />
        <Route path="/shifts/assign" element={<AssignShiftPage />} />
        <Route path="/shifts/:id" element={<ShiftDetailPage />} />
        <Route path="/my-shift" element={<MyShiftPage />} />
        <Route path="/shifts/rosters" element={<RosterListPage />} />
        <Route path="/shifts/generate" element={<GenerateRosterPage />} />
        <Route path="/rosters" element={<RosterListPage />} />
        <Route path="/rosters/generate" element={<GenerateRosterPage />} />
        <Route path="/rosters/calendar" element={<RosterCalendarPage />} />

        {/* Holiday Calendar Routes */}
        <Route path="/holidays" element={<HolidayCalendarPage />} />
        <Route path="/holidays/list" element={<HolidayListPage />} />
        <Route path="/holidays/assign" element={<HolidayAssignmentPage />} />

        {/* Biometric Cards & Hardware Devices */}
        <Route path="/biometric/cards" element={<CardListPage />} />
        <Route path="/biometric/cards/generate" element={<GenerateCardPage />} />
        <Route path="/biometric/cards/:id" element={<CardDetailPage />} />
        <Route path="/biometric/devices" element={<DeviceListPage />} />
        <Route path="/biometric/devices/:id" element={<DeviceDetailPage />} />

        {/* Face Registration Routes */}
        <Route path="/face-registration" element={<FaceRegisterPage />} />
        <Route path="/face/register" element={<FaceRegisterPage />} />
        <Route path="/face/bulk-register" element={<BulkRegisterFacePage />} />
        <Route path="/face/status" element={<FaceRegistrationStatusPage />} />
        <Route path="/face/approvals" element={<FaceApprovalsPage />} />
        <Route path="/face/directory" element={<FaceStatusPage />} />
        <Route path="/face/stats" element={<FaceStatsPage />} />

        {/* Finger Attendance Routes */}
        <Route path="/finger-attendance" element={<FingerEnrollmentPage />} />
        <Route path="/finger/enrollment" element={<FingerEnrollmentPage />} />
        <Route path="/finger/devices" element={<FingerDevicePage />} />
        <Route path="/finger/punches" element={<FingerPunchesPage />} />

        {/* Card Attendance Route Shortcut */}
        <Route path="/card-attendance" element={<CardListPage />} />

        {/* Advanced Security & Zero Trust Routes */}
        <Route path="/security/dashboard" element={<SecurityDashboardPage />} />
        <Route path="/security/settings" element={<SecuritySettingsPage />} />
        <Route path="/security/fraud-signals" element={<FraudSignalsPage />} />
        <Route path="/security/events" element={<SecurityEventsPage />} />
        <Route path="/security/audit-logs" element={<AuditLogsPage />} />
        <Route path="/security/blocked-employees" element={<BlockedEmployeesPage />} />

        {/* Approvals Routes */}
        <Route path="/approvals/workflows" element={<WorkflowsPage />} />
        <Route path="/approvals/workflows/:id" element={<WorkflowDetailPage />} />
        <Route path="/approvals/requests" element={<ApprovalRequestsPage />} />
        <Route path="/approvals/history" element={<ApprovalHistoryPage />} />

        {/* Assets Routes */}
        <Route path="/assets" element={<AssetListPage />} />
        <Route path="/assets/create" element={<CreateAssetPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/assets/assign" element={<AssignAssetPage />} />
        <Route path="/assets/return" element={<ReturnAssetPage />} />
        <Route path="/assets/categories" element={<AssetCategoriesPage />} />

        {/* Emergency Attendance Routes */}
        <Route path="/emergency-attendance" element={<EmergencyAttendancePage />} />
        <Route path="/emergency-attendance/requests" element={<EmergencyRequestsPage />} />
        <Route path="/emergency-attendance/stats" element={<EmergencyStatsPage />} />

        {/* Phase 5B - Refunds Routes */}
        <Route path="/refunds" element={<RefundListPage />} />
        <Route path="/refunds/request" element={<RefundRequestPage />} />
        <Route path="/refunds/:id" element={<RefundDetailPage />} />
        <Route path="/admin/refunds" element={<AdminRefundListPage />} />
        <Route path="/admin/refunds/system-issue" element={<SystemIssueRefundPage />} />
        <Route path="/admin/refunds/:id" element={<AdminRefundDetailPage />} />

        {/* Phase 5B - Payment Analytics Routes */}
        <Route path="/payment-analytics/revenue" element={<RevenueDashboardPage />} />
        <Route path="/payment-analytics/churn" element={<ChurnAnalysisPage />} />
        <Route path="/payment-analytics/success-rate" element={<PaymentSuccessPage />} />
        <Route path="/payment-analytics/refunds" element={<RefundAnalyticsPage />} />

        {/* Phase 5B - Coupons Routes */}
        <Route path="/coupons" element={<CouponListPage />} />
        <Route path="/coupons/:id" element={<CouponDetailPage />} />

        {/* Phase 5B - Client Portal Routes */}
        <Route path="/client-portal" element={<ClientDashboardPage />} />
        <Route path="/client-portal/dashboard" element={<ClientDashboardPage />} />
        <Route path="/client-portal/projects" element={<ClientProjectsPage />} />
        <Route path="/client-portal/projects/:id" element={<ClientProjectDetailPage />} />
        <Route path="/client-portal/requirements" element={<ClientRequirementsPage />} />
        <Route path="/client-portal/comments" element={<ClientCommentsPage />} />
        <Route path="/client-portal/invoices" element={<ClientInvoicesPage />} />
        <Route path="/client-portal/payments" element={<ClientPaymentsPage />} />
        {/* AI Hub Route - Only SUPER_ADMIN and COMPANY_ADMIN */}
        <Route
          path="/ai/hub"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'COMPANY_ADMIN']}>
              <AIHubPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <AIChatbotWidget />
    </>
  );
}
