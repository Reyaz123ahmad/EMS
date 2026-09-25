# Phase 4C: HR Operations API Verification & UI Mapping Matrix

## 1. Overview
This report documents the full payload testing of all Phase 4C endpoints across Attendance, Leave Management, Payroll, Overtime, Shifts & Rosters, and Holiday Calendars, verifying 100% OK responses along with the frontend UI components and pages mapping.

---

## 2. API Endpoints Test Matrix (Full Payloads)

| Module | Endpoint | Method | Full Payload Sample | Status | Verified Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Attendance** | `/attendance/calendar` | `GET` | `?companyId={id}&month=9&year=2026` | `200 OK` | Day-wise attendance array with status and badge color coding |
| **Attendance** | `/attendance/summary` | `GET` | `?companyId={id}&employeeId={id}&month=9&year=2026` | `200 OK` | Metrics: present, absent, late, halfDays, leave, totalHours |
| **Attendance** | `/attendance/manual` | `POST` | `{"employeeId":"...","date":"2026-09-24","checkIn":"09:00","checkOut":"18:00","status":"PRESENT","reason":"Punch fix"}` | `200 OK` | Manual attendance record inserted and logs updated |
| **Attendance** | `/attendance/bulk-mark` | `POST` | `{"employeeIds":["..."],"date":"2026-09-23","status":"PRESENT","markedBy":"..."}` | `200 OK` | Bulk attendance records created/updated with count |
| **Attendance** | `/attendance/exceptions` | `GET` | `?companyId={id}&startDate=2026-09-01&endDate=2026-09-30` | `200 OK` | List of missing punch, late arrival, and unexcused absences |
| **Attendance** | `/attendance/policy` | `PUT` | `{"policy":{"workHoursPerDay":8,"gracePeriodMinutes":15}}` | `200 OK` | Attendance policy updated in company JSON settings |
| **Leave** | `/leave/types` | `POST` | `{"name":"Privilege Leave","code":"PL","daysAllowed":15,"isPaid":true,"carryForward":true,"maxCarryForwardDays":5}` | `201 Created` | Leave type created with code & entitlement rules |
| **Leave** | `/leave/balances/bulk-allocate` | `POST` | `{"leaveTypeId":"...","year":2026,"days":15,"employeeIds":["..."]}` | `200 OK` | Balance allocated across selected employees |
| **Leave** | `/leave/apply` | `POST` | `{"employeeId":"...","leaveTypeId":"...","startDate":"2026-10-05","endDate":"2026-10-07","reason":"Vacation"}` | `201 Created` | Leave request registered with status PENDING |
| **Leave** | `/leave/requests/:id/approve` | `PUT` | `{"approvedBy":"...","remarks":"Approved by HR Operations"}` | `200 OK` | Status changed to APPROVED, leave balance deducted |
| **Leave** | `/leave/calendar` | `GET` | `?companyId={id}&month=10&year=2026` | `200 OK` | Team calendar with all scheduled leaves & employee avatars |
| **Payroll** | `/payroll/components` | `POST` | `{"name":"Dearness Allowance","code":"DA","type":"EARNING","calculationType":"PERCENTAGE","defaultAmount":20}` | `201 Created` | Salary component created for earnings/deductions |
| **Payroll** | `/payroll/preview` | `POST` | `{"companyId":"...","month":9,"year":2026}` | `200 OK` | Payroll preview with gross, deductions, net salary estimations |
| **Payroll** | `/payroll/process` | `POST` | `{"companyId":"...","month":9,"year":2026,"processedBy":"..."}` | `201 Created` | Payroll run executed, payslips generated, queue dispatched |
| **Payroll** | `/payroll/runs/:id/approve` | `PUT` | `{"approvedBy":"..."}` | `200 OK` | Payroll status updated to APPROVED |
| **Overtime** | `/overtime/rules` | `POST` | `{"name":"Holiday Rate","dayType":"HOLIDAY","multiplier":2.5,"minMinutes":60,"maxDailyMinutes":480}` | `201 Created` | Overtime rate multiplier rule configured |
| **Overtime** | `/overtime/apply` | `POST` | `{"employeeId":"...","date":"2026-09-24","minutes":180,"reason":"Urgent deployment"}` | `201 Created` | Overtime claim recorded with auto-calculated multiplier |
| **Overtime** | `/overtime/requests/:id/approve` | `PUT` | `{"approvedBy":"...","remarks":"Overtime verified"}` | `200 OK` | Status changed to APPROVED |
| **Shifts** | `/shifts` | `POST` | `{"name":"Evening Shift","code":"ES","startTime":"16:00","endTime":"00:00","isNightShift":true}` | `201 Created` | Shift timings created |
| **Shifts** | `/shifts/assign` | `POST` | `{"shiftId":"...","effectiveFrom":"2026-10-01","effectiveTo":"2026-12-31","employeeIds":["..."]}` | `200 OK` | Shift assigned to employees |
| **Rosters** | `/rosters/generate` | `POST` | `{"month":10,"year":2026,"shiftId":"...","shiftPattern":"5_2"}` | `201 Created` | Monthly schedule auto-generated skipping non-working days |
| **Rosters** | `/rosters/calendar` | `GET` | `?companyId={id}&month=10&year=2026` | `200 OK` | Full roster view across shifts and departments |
| **Holidays** | `/holiday-calendars` | `POST` | `{"name":"Bangalore Holidays","year":2026,"isDefault":true}` | `201 Created` | Annual holiday calendar group established |
| **Holidays** | `/holidays` | `POST` | `{"calendarId":"...","name":"Kannada Rajyotsava","date":"2026-11-01","isOptional":false}` | `201 Created` | Individual festival holiday created |
| **Holidays** | `/holidays/bulk-import` | `POST` | `{"calendarId":"...","holidays":[{"name":"Republic Day","date":"2026-01-26"}]}` | `200 OK` | Bulk batch imported into holiday calendar |
| **Holidays** | `/holidays/calendar` | `GET` | `?companyId={id}&year=2026` | `200 OK` | List of upcoming and observed holidays |

---

## 3. Frontend UI Mapping Matrix

| Page Path | Route | React Components | Associated React Query Hook |
| :--- | :--- | :--- | :--- |
| **Attendance Today** | `/attendance` | `AttendancePage`, `AttendanceCard`, `ModeSelector`, `CameraCapture`, `GeoLocation`, `BreakTimer` | `useTodayAttendance`, `useCheckIn`, `useCheckOut`, `useBreak` |
| **Attendance Logs** | `/attendance/logs` | `AttendanceLogsPage`, `Table`, `Badge`, `DateRangeFilter` | `useAttendanceLogs`, `useExportAttendance` |
| **Monthly Summary** | `/attendance/monthly-summary` | `MonthlySummaryPage`, `StatsCard`, `Recharts` | `useAttendanceMonthlySummary` |
| **Attendance Calendar** | `/attendance/calendar` | `AttendanceCalendarPage`, `AttendanceCalendar` | `useAttendanceCalendar` |
| **Attendance Exceptions** | `/attendance/exceptions` | `AttendanceExceptionsPage`, `AttendanceExceptionCard` | `useAttendanceExceptions` |
| **Manual Attendance** | `/attendance/manual` | `ManualAttendancePage`, `ManualAttendanceForm` | `useMarkManualAttendance`, `useBulkMarkAttendance` |
| **Leave Types** | `/leave/types` | `LeaveTypesPage`, `Table`, `Badge`, `Modal` | `useLeaveTypes`, `useCreateLeaveType`, `useBulkAllocateLeaves` |
| **Leave Balance** | `/leave/balance` | `LeaveBalancePage`, `LeaveBalanceCard` | `useLeaveBalances` |
| **Apply Leave** | `/leave/apply` | `ApplyLeavePage`, `LeaveRequestModal` | `useApplyLeave`, `useLeaveBalances` |
| **Leave Requests** | `/leave/requests` | `LeaveRequestsPage`, `LeaveApprovalModal`, `LeaveRequestCard` | `useLeaveRequests`, `useApproveLeave`, `useRejectLeave` |
| **Leave Calendar** | `/leave/calendar` | `LeaveCalendarPage`, `LeaveCalendar` | `useLeaveCalendar` |
| **Leave History** | `/leave/history` | `LeaveHistoryPage`, `Table` | `useEmployeeLeaveHistory`, `useLeaveStats` |
| **Salary Structure** | `/payroll/salary-structure` | `SalaryStructurePage`, `SalaryBreakdown`, `Modal` | `useSalaryComponents`, `useBulkUpdateSalaryStructure` |
| **Payroll Run** | `/payroll/run` | `PayrollRunPage`, `PayrollPreview`, `PayrollProgress` | `usePreviewPayroll`, `useProcessPayroll` |
| **Payroll Runs List** | `/payroll/runs` | `PayrollRunsListPage`, `Table`, `Badge` | `usePayrollRuns` |
| **Payroll Detail** | `/payroll/runs/:id` | `PayrollDetailPage`, `PayrollPreview`, `SalaryBreakdown` | `usePayrollDetail`, `useApprovePayroll` |
| **Salary Slips** | `/payroll/slips` | `SalarySlipsPage`, `SalarySlipCard` | `useSalarySlips` |
| **Employee Salary** | `/payroll/employee/:id` | `EmployeeSalaryPage`, `SalaryBreakdown` | `useEmployeeSalaryStructure` |
| **Overtime Rules** | `/overtime/rules` | `OvertimeRulesPage`, `Table`, `Modal` | `useOvertimeRules`, `useCreateOvertimeRule` |
| **Overtime Records** | `/overtime/records` | `OvertimeRecordsPage`, `Table`, `Badge` | `useOvertimeRecords` |
| **Apply Overtime** | `/overtime/apply` | `ApplyOvertimePage`, `OvertimeCard` | `useApplyOvertime` |
| **Overtime Requests** | `/overtime/requests` | `OvertimeRequestsPage`, `OvertimeApprovalModal` | `useOvertimeRequests`, `useApproveOvertime` |
| **Overtime Stats** | `/overtime/stats` | `OvertimeStatsPage`, `StatsCard`, `Recharts` | `useOvertimeStats` |
| **Shifts List** | `/shifts` | `ShiftListPage`, `ShiftCard`, `Modal` | `useShifts`, `useCreateShift` |
| **Assign Shift** | `/shifts/assign` | `AssignShiftPage`, `ShiftAssignmentModal` | `useAssignShift` |
| **Rosters List** | `/rosters` | `RosterListPage`, `Table` | `useRosters` |
| **Generate Roster** | `/rosters/generate` | `GenerateRosterPage`, `ShiftCard` | `useGenerateRoster` |
| **Roster Calendar** | `/rosters/calendar` | `RosterCalendarPage`, `RosterCalendar` | `useRosterCalendar`, `usePublishRoster` |
| **Holiday Calendar** | `/holidays` | `HolidayCalendarPage`, `HolidayCalendar`, `HolidayForm` | `useHolidayCalendar`, `useBulkImportHolidays` |
| **Holiday List** | `/holidays/list` | `HolidayListPage`, `HolidayCard`, `Table` | `useHolidays`, `useCreateHoliday` |
| **Holiday Assign** | `/holidays/assign` | `HolidayAssignmentPage`, `Table` | `useHolidayCalendars` |

---

## 4. Test Verification Summary
- **Backend**: Automated master test suite (`backend/tests/run-phase-4c.js`) executed against `http://localhost:5000/api/v1` and passed 100% of full-payload endpoints.
- **Frontend**: All pages, components, hooks, routes, and sidebar navigation items built cleanly with Vite + Tailwind CSS v4.
