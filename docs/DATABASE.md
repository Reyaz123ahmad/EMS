# Database Architecture & Schema Documentation

EMS utilizes **PostgreSQL** paired with **Prisma ORM** for enterprise-grade type safety, migrations, and performance indexing.

## Core Models & Domain Groups

1. **Platform & Companies**: `SubscriptionPlan`, `Company`, `Subscription`, `PaymentTransaction`, `RefundRequest`, `Coupon`, `Invoice`
2. **Auth & RBAC**: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Session`, `LoginLog`, `AuditLog`, `SecurityEvent`
3. **Employees & Organization**: `Employee`, `Branch`, `Department`, `Designation`, `EmployeeCard`, `EmployeeDevice`
4. **Attendance & Biometrics**: `AttendanceLog`, `AttendanceBreak`, `BiometricDevice`, `DevicePunch`, `FraudSignal`, `LivenessVerification`
5. **Leave & Holidays**: `LeaveType`, `LeaveBalance`, `LeaveRequest`, `HolidayCalendar`, `Holiday`
6. **Shifts & Rosters**: `Shift`, `ShiftAssignment`, `Roster`, `BreakRule`, `OvertimeRule`
7. **Payroll**: `SalaryComponent`, `EmployeeSalaryStructure`, `SalaryStructureComponent`, `PayrollRun`, `PayrollItem`, `SalarySlip`
8. **Projects & Clients**: `Client`, `Project`, `ProjectMember`, `ProjectModule`, `ProjectMilestone`, `ProjectTask`, `ProjectRequirement`, `ProjectComment`
9. **Assets & Documents**: `Asset`, `AssetAssignment`, `DocumentType`, `EmployeeDocument`, `CertificateTemplate`, `EmployeeCertificate`
10. **Notifications & Auditing**: `NotificationTemplate`, `Notification`, `NotificationLog`, `ReportHistory`

---

## Production Indexes & Optimization
- `AttendanceLog`: `@@index([companyId, attendanceDate])`, `@@index([employeeId, attendanceDate])`
- `Employee`: `@@unique([companyId, employeeCode])`, `@@index([companyId, email])`
- `LeaveRequest`: `@@index([employeeId, status])`
- `PayrollRun`: `@@unique([companyId, month, year])`
- `RefundRequest`: `@@index([companyId, status])`, `@@index([paymentId])`
- `Notification`: `@@index([userId, isRead])`
- `AuditLog`: `@@index([userId, createdAt])`, `@@index([entity, entityId])`
- `Session`: `@@index([userId])`, `@@unique([refreshToken])`
