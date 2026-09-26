import axios from 'axios';
import { prisma } from '../src/config/prisma.js';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== RUNNING LIVE VERIFICATION FOR ISSUES 1, 2, 3 ===\n');

  // 1. Setup / authenticate users
  console.log('1. Authenticating Super Admin...');
  const superAdminLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'reyazahmadmath@gmail.com',
    password: 'Password@123'
  }).catch(() => null) || await axios.post(`${API_BASE}/auth/login`, {
    email: 'reyazahmadmath@gmail.com',
    password: 'Reyaz123@_Ahmad'
  });

  const superToken = superAdminLogin.data.data.token || superAdminLogin.data.data.accessToken;
  console.log('PASS: Super Admin authenticated successfully');

  // Find or create a company admin user for company scoped tests
  let company = await prisma.company.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Test Tenant Corp',
        domain: 'testcorp',
        email: 'admin@testcorp.com',
        status: 'ACTIVE'
      }
    });
  }

  let companyAdmin = await prisma.user.findFirst({
    where: { companyId: company.id }
  });

  if (!companyAdmin) {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash('Password@123', 10);
    companyAdmin = await prisma.user.create({
      data: {
        email: `companyadmin_${Date.now()}@testcorp.com`,
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        companyId: company.id
      }
    });

    let role = await prisma.role.findFirst({
      where: { name: 'COMPANY_ADMIN', companyId: company.id }
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'COMPANY_ADMIN',
          companyId: company.id,
          description: 'Company Admin'
        }
      });
    }

    await prisma.userRole.create({
      data: {
        userId: companyAdmin.id,
        roleId: role.id
      }
    });
  }

  // Use generateAccessToken helper for generating valid tokens
  const { generateAccessToken } = await import('../src/security/jwt.js');
  const companyToken = generateAccessToken({
    id: companyAdmin.id,
    email: companyAdmin.email,
    role: 'COMPANY_ADMIN',
    companyId: company.id
  });
  console.log(`PASS: Company Admin token generated for company: ${company.name} (${company.id})`);

  // ================= ISSUE 1: APPROVE/REJECT BUTTONS & ROUTES =================
  console.log('\n--- Testing ISSUE 1: Approval Request Endpoints ---');

  // Ensure an approval workflow exists
  let workflow = await prisma.approvalWorkflow.findFirst({
    where: { companyId: company.id }
  });
  if (!workflow) {
    workflow = await prisma.approvalWorkflow.create({
      data: {
        companyId: company.id,
        name: 'General Leave Workflow',
        entityType: 'LEAVE',
        levels: JSON.stringify([{ level: 1, role: 'COMPANY_ADMIN' }]),
        isActive: true
      }
    });
  }

  // Create test approval request
  const testRequest = await prisma.approvalRequest.create({
    data: {
      workflowId: workflow.id,
      entityType: 'LEAVE',
      entityId: 'test-entity-001',
      requestedBy: companyAdmin.id,
      currentLevel: 1,
      status: 'PENDING'
    }
  });
  console.log(`Created test approval request ID: ${testRequest.id}`);

  // Test POST /requests/:id/approve
  const approveRes = await axios.post(
    `${API_BASE}/approvals/requests/${testRequest.id}/approve`,
    { notes: 'Approved via automated test' },
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );
  console.log(`Approve response status: ${approveRes.status}, body status: ${approveRes.data.status}`);
  const updatedAfterApprove = await prisma.approvalRequest.findUnique({ where: { id: testRequest.id } });
  console.log(`PASS: Request status after approve: ${updatedAfterApprove.status}`);
  if (updatedAfterApprove.status !== 'APPROVED') {
    throw new Error(`Expected APPROVED, got ${updatedAfterApprove.status}`);
  }

  // Reset to PENDING and test POST /requests/:id/reject
  await prisma.approvalRequest.update({
    where: { id: testRequest.id },
    data: { status: 'PENDING' }
  });

  const rejectRes = await axios.post(
    `${API_BASE}/approvals/requests/${testRequest.id}/reject`,
    { notes: 'Rejected via automated test' },
    { headers: { Authorization: `Bearer ${companyToken}` } }
  );
  console.log(`Reject response status: ${rejectRes.status}, body status: ${rejectRes.data.status}`);
  const updatedAfterReject = await prisma.approvalRequest.findUnique({ where: { id: testRequest.id } });
  console.log(`PASS: Request status after reject: ${updatedAfterReject.status}`);
  if (updatedAfterReject.status !== 'REJECTED') {
    throw new Error(`Expected REJECTED, got ${updatedAfterReject.status}`);
  }

  // Clean up test request
  await prisma.approvalRequest.delete({ where: { id: testRequest.id } });

  // ================= ISSUE 2: EMPLOYEES PAGE EMPTY STATUS / NULL FILTERS =================
  console.log('\n--- Testing ISSUE 2: Employee List Filters and Empty Strings ---');

  // Test 1: No query params
  const resNoParams = await axios.get(`${API_BASE}/employees`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /employees (no params) -> HTTP ${resNoParams.status}, total employees: ${resNoParams.data.data.total}`);

  // Test 2: Empty string query params (which previously triggered "status is not allowed to be empty")
  const resEmptyStrings = await axios.get(`${API_BASE}/employees?status=&departmentId=&branchId=&search=`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /employees?status=&departmentId=&branchId=&search= -> HTTP ${resEmptyStrings.status}, total: ${resEmptyStrings.data.data.total}`);

  // Test 3: Specific valid filter
  const resActive = await axios.get(`${API_BASE}/employees?status=ACTIVE&page=1&limit=10`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /employees?status=ACTIVE -> HTTP ${resActive.status}, returned count: ${resActive.data.data.employees.length}`);

  // ================= ISSUE 3: REMOVAL OF HARDCODED DATA ACROSS ALL DASHBOARDS =================
  console.log('\n--- Testing ISSUE 3: Real Database Endpoints For All Roles ---');

  // 1. Super Admin Dashboard
  const resSuperDashboard = await axios.get(`${API_BASE}/dashboard/super-admin`, {
    headers: { Authorization: `Bearer ${superToken}` }
  });
  console.log(`PASS: GET /dashboard/super-admin -> HTTP ${resSuperDashboard.status}, Total Companies: ${resSuperDashboard.data.data.totalCompanies}, Revenue: ${resSuperDashboard.data.data.totalRevenue}`);

  // 2. Company Admin Dashboard
  const resCompanyDashboard = await axios.get(`${API_BASE}/dashboard/company-admin`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/company-admin -> HTTP ${resCompanyDashboard.status}, Total Employees: ${resCompanyDashboard.data.data.totalEmployees}, Present: ${resCompanyDashboard.data.data.presentToday}`);

  // 3. HR Admin Dashboard
  const resHRAdminDashboard = await axios.get(`${API_BASE}/dashboard/hr-admin`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/hr-admin -> HTTP ${resHRAdminDashboard.status}, Total Employees: ${resHRAdminDashboard.data.data.totalEmployees}, Leaves: ${resHRAdminDashboard.data.data.pendingLeaves.length}`);

  // 4. HR Manager Dashboard
  const resHRManagerDashboard = await axios.get(`${API_BASE}/dashboard/hr-manager`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/hr-manager -> HTTP ${resHRManagerDashboard.status}, Team Size: ${resHRManagerDashboard.data.data.teamSize}, Team Members: ${resHRManagerDashboard.data.data.teamMembers.length}`);

  // 5. Manager Dashboard
  const resManagerDashboard = await axios.get(`${API_BASE}/dashboard/manager`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/manager -> HTTP ${resManagerDashboard.status}, Direct Reports: ${resManagerDashboard.data.data.directReports}, Tasks: ${resManagerDashboard.data.data.pendingTasks}`);

  // 6. Employee Dashboard
  const resEmployeeDashboard = await axios.get(`${API_BASE}/dashboard/employee`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/employee -> HTTP ${resEmployeeDashboard.status}, IsCheckedIn: ${resEmployeeDashboard.data.data.isCheckedIn}, Month Attendance: ${resEmployeeDashboard.data.data.monthlyAttendanceCount}`);

  // 7. Client Dashboard
  const resClientDashboard = await axios.get(`${API_BASE}/dashboard/client`, {
    headers: { Authorization: `Bearer ${companyToken}` }
  });
  console.log(`PASS: GET /dashboard/client -> HTTP ${resClientDashboard.status}, Active Projects: ${resClientDashboard.data.data.activeProjects}, Total Invoiced: ${resClientDashboard.data.data.totalInvoiced}`);

  console.log('\n======================================================');
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests()
  .catch(err => {
    console.error('❌ TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
