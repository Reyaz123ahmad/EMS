# EMS Phase 4B: Core HR & Admin UI & Backend API Test Report

**Execution Timestamp:** 2026-09-25  
**Environment:** Node.js v20+, Express.js, Prisma ORM, PostgreSQL, Redis, BullMQ, React 18, Vite, Tailwind CSS v4  

---

## 1. Overview & Architecture

Phase 4B completes the comprehensive HR and Administrative management suite for EMS Enterprise, delivering 2-step OTP flows for Company onboarding and Employee creation, full Organization management (Branches with geo-fencing, Departments with headcount, and Designations with hierarchy levels), Document compliance management with review auditing, and an 8-type multi-category analytical Report generation and export engine (CSV, Excel, PDF).

---

## 2. API Endpoints & Full Payload Test Specifications

### 2.1 Company Module (2-Step Registration & Management)
| Endpoint | Method | Role | Full Payload Sample | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `/companies/send-otp` | `POST` | `SUPER_ADMIN` | `{ companyData: { name, domain, email, phone, address, country, timezone, currency }, adminData: { firstName, lastName, email, phone } }` | `200 OK` (returns `sessionId`) |
| `/companies/verify-otp` | `POST` | `SUPER_ADMIN` | `{ email, otp, sessionId }` | `200 OK` (returns `verified: true`) |
| `/companies/create` | `POST` | `SUPER_ADMIN` | `{ sessionId, companyData, adminData }` | `201 Created` (creates Company, Subscription, User, Role, Settings) |
| `/companies/stats` | `GET` | `SUPER_ADMIN` | None | `200 OK` (totalCompanies, activeCount, expiredCount) |
| `/companies/analytics` | `GET` | `SUPER_ADMIN` | Query: `startDate=2026-01-01&endDate=2026-12-31` | `200 OK` (retention, trialConversion) |

### 2.2 Employee Module (2-Step Onboarding, Bulk Import & Export)
| Endpoint | Method | Role | Full Payload Sample | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `/employees/send-otp` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | `{ employeeData: { firstName, lastName, email, phone, employeeCode, joiningDate, employmentType, status }, companyId }` | `200 OK` (returns `sessionId`) |
| `/employees/verify-otp` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | `{ email, otp, sessionId }` | `200 OK` (returns `verified: true`) |
| `/employees/create` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | `{ sessionId, employeeData, companyId }` | `201 Created` (creates Employee, User account, Leaves, Role) |
| `/employees/bulk-import` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ rows: [ { firstName, lastName, email, phone, employeeCode, employmentType } ], companyId }` | `200 OK` (returns `successful`, `failed`, `errors`) |
| `/employees/export` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | Query: `format=csv&status=ACTIVE` | `200 OK` (returns `downloadUrl`, `totalRows`) |
| `/employees/stats` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | None | `200 OK` (total, active, onLeave, terminated) |
| `/employees/analytics` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | Query: `startDate=2026-01-01&endDate=2026-12-31` | `200 OK` (turnoverRate, genderRatio, growth) |

### 2.3 Organization Modules (Branch, Department, Designation)
| Endpoint | Method | Role | Full Payload Sample | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `/branches` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ name, code, address, city, state, country, latitude, longitude, radiusMeters }` | `201 Created` |
| `/branches/stats` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN` | None | `200 OK` |
| `/departments` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ name, code, description, headEmployeeId }` | `201 Created` |
| `/departments/stats` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN` | None | `200 OK` |
| `/designations` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ name, code, description, level }` | `201 Created` |
| `/designations/stats` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN` | None | `200 OK` |

### 2.4 Document Module
| Endpoint | Method | Role | Full Payload Sample | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `/documents/upload` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `EMPLOYEE` | `multipart/form-data` with `file`, `title`, `type`, `employeeId`, `notes` | `201 Created` |
| `/documents/:id/verify` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ verifiedNotes }` | `200 OK` (status: `VERIFIED`) |
| `/documents/:id/reject` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN` | `{ reason }` | `200 OK` (status: `REJECTED`) |
| `/documents/:id/download`| `GET` | Authenticated | None | `200 OK` (returns signed download URL) |
| `/documents/stats` | `GET` | Authenticated | None | `200 OK` (total, pending, verified, rejected) |

### 2.5 Reports Module (8 Types + Multi-Format Exports)
| Endpoint | Method | Role | Full Payload Sample | Expected Status |
| :--- | :--- | :--- | :--- | :--- |
| `/reports/generate` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | `{ type: "ATTENDANCE" \| "EMPLOYEE" \| "LEAVE" \| "PAYROLL" \| "OVERTIME" \| "PERFORMANCE" \| "PROJECT" \| "CLIENT", filters: { startDate, endDate, departmentId, branchId } }` | `200 OK` (returns rows & count) |
| `/reports/export` | `POST` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | `{ type, format: "CSV" \| "EXCEL" \| "PDF", filters }` | `200 OK` (returns fileUrl & creates ReportHistory) |
| `/reports/stats` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | None | `200 OK` |
| `/reports/history` | `GET` | `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER` | None | `200 OK` (past exports list) |

---

## 3. UI to API Mapping Matrix

| Page Component | Route | Key Hooks | Backend Endpoints Called |
| :--- | :--- | :--- | :--- |
| `CompanyListPage` | `/companies` | `useCompanies` | `GET /companies` |
| `CreateCompanyPage` | `/companies/create` | `useSendCompanyOTP`, `useVerifyCompanyOTP`, `useCreateCompany` | `POST /companies/send-otp`, `POST /companies/verify-otp`, `POST /companies/create` |
| `CompanyDetailPage` | `/companies/:id` | `useCompany` | `GET /companies/:id` |
| `CompanySettingsPage` | `/companies/:id/settings` | `useCompanySettings`, `useUpdateCompanySettings` | `GET /companies/:id/settings`, `PUT /companies/:id/settings` |
| `EmployeeListPage` | `/employees` | `useEmployees`, `useDeleteEmployee` | `GET /employees`, `DELETE /employees/:id` |
| `CreateEmployeePage` | `/employees/create` | `useSendEmployeeOTP`, `useVerifyEmployeeOTP`, `useCreateEmployee` | `POST /employees/send-otp`, `POST /employees/verify-otp`, `POST /employees/create` |
| `EditEmployeePage` | `/employees/:id/edit` | `useEmployee`, `useUpdateEmployee` | `GET /employees/:id`, `PUT /employees/:id` |
| `BulkImportEmployeesPage`| `/employees/bulk-import` | `useBulkImportEmployees` | `POST /employees/bulk-import` |
| `BranchListPage` | `/organization/branches` | `useBranches`, `useCreateBranch`, `useDeleteBranch` | `GET /branches`, `POST /branches`, `DELETE /branches/:id` |
| `BranchDetailPage` | `/organization/branches/:id` | `useBranch` | `GET /branches/:id` |
| `DepartmentListPage` | `/organization/departments` | `useDepartments`, `useCreateDepartment`, `useDeleteDepartment` | `GET /departments`, `POST /departments`, `DELETE /departments/:id` |
| `DepartmentDetailPage` | `/organization/departments/:id` | `useDepartment` | `GET /departments/:id` |
| `DesignationListPage` | `/organization/designations` | `useDesignations`, `useCreateDesignation`, `useDeleteDesignation` | `GET /designations`, `POST /designations`, `DELETE /designations/:id` |
| `DesignationDetailPage`| `/organization/designations/:id` | `useDesignation` | `GET /designations/:id` |
| `DocumentListPage` | `/documents` | `useDocuments`, `useVerifyDocument`, `useRejectDocument`, `useDeleteDocument` | `GET /documents`, `POST /documents/:id/verify`, `POST /documents/:id/reject`, `DELETE /documents/:id` |
| `DocumentUploadPage` | `/documents/upload` | `useUploadDocument` | `POST /documents/upload` |
| `DocumentDetailPage` | `/documents/:id` | `useDocument`, `useVerifyDocument`, `useRejectDocument` | `GET /documents/:id`, `POST /documents/:id/verify`, `POST /documents/:id/reject` |
| `ReportsPage` | `/reports` | `useGenerateReport`, `useExportReport` | `POST /reports/generate`, `POST /reports/export` |
| `ReportHistoryPage` | `/reports/history` | `useReportHistory` | `GET /reports/history` |
