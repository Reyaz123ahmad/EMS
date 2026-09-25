import { prisma } from '../src/config/prisma.js';
import authRepository from '../src/modules/auth/auth.repository.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runEmployeeTests(companyId) {
  console.log('\n--- [2/5] STARTING EMPLOYEES MODULE TEST SUITE ---');

  let adminUser = await prisma.user.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
  }

  const effectiveCompanyId = companyId || adminUser.companyId;

  const token = generateAccessToken({
    id: adminUser.id,
    sub: adminUser.id,
    userId: adminUser.id,
    email: adminUser.email,
    role: 'COMPANY_ADMIN',
    companyId: effectiveCompanyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const testSuffix = Date.now();
  const empEmail = `emp_${testSuffix}@example.com`;

  // 1. Send Employee OTP (Step 1)
  console.log('1. Testing POST /api/v1/employees/send-otp (Full Payload)...');
  const sendOtpPayload = {
    employeeData: {
      firstName: 'Samantha',
      lastName: 'Miller',
      email: empEmail,
      phone: '+1 555 992 0183',
      employeeCode: `EMP-${testSuffix.toString().slice(-4)}`,
      joiningDate: '2026-03-01',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE'
    },
    companyId: effectiveCompanyId
  };

  const otpRes = await fetch(`${BASE_URL}/employees/send-otp`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(sendOtpPayload)
  });
  const otpData = await otpRes.json();
  console.log('Send Employee OTP Status:', otpRes.status, 'Session ID:', otpData.data?.sessionId);
  if (otpRes.status !== 200 || !otpData.data?.sessionId) {
    throw new Error(`Send Employee OTP failed: ${JSON.stringify(otpData)}`);
  }

  const sessionId = otpData.data.sessionId;

  // 2. Verify Employee OTP (Step 2)
  console.log('2. Testing POST /api/v1/employees/verify-otp (Valid OTP)...');
  const sessionRaw = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
  let parsed = typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;
  if (parsed && typeof parsed.otp === 'string' && parsed.otp.startsWith('{')) {
    try {
      parsed = JSON.parse(parsed.otp);
    } catch (e) {}
  }
  const validOtp = parsed?.otp || '123456';

  const verifyRes = await fetch(`${BASE_URL}/employees/verify-otp`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: empEmail,
      otp: validOtp,
      sessionId
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify Employee OTP Status:', verifyRes.status, 'Verified:', verifyData.data?.verified);
  if (verifyRes.status !== 200 || !verifyData.data?.verified) {
    throw new Error(`Verify Employee OTP failed: ${JSON.stringify(verifyData)}`);
  }

  // 3. Create Employee with User account (Step 3)
  console.log('3. Testing POST /api/v1/employees/create (Complete 2-Step Employee Onboarding)...');
  const createEmpRes = await fetch(`${BASE_URL}/employees/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      employeeData: sendOtpPayload.employeeData,
      companyId: effectiveCompanyId
    })
  });
  const createEmpData = await createEmpRes.json();
  console.log('Create Employee Status:', createEmpRes.status, 'Employee ID:', createEmpData.data?.employee?.id);
  if (createEmpRes.status !== 201 || !createEmpData.data?.employee?.id) {
    throw new Error(`Create Employee failed: ${JSON.stringify(createEmpData)}`);
  }

  const createdEmployeeId = createEmpData.data.employee.id;

  // 4. Bulk Import Employees
  console.log('4. Testing POST /api/v1/employees/bulk-import...');
  const bulkRows = [
    {
      firstName: 'Alice',
      lastName: 'Walker',
      email: `alice_${testSuffix}@example.com`,
      phone: '+1 555 111 2233',
      employeeCode: `EMP-B1-${testSuffix.toString().slice(-3)}`,
      employmentType: 'FULL_TIME'
    },
    {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: `bob_${testSuffix}@example.com`,
      phone: '+1 555 222 3344',
      employeeCode: `EMP-B2-${testSuffix.toString().slice(-3)}`,
      employmentType: 'FULL_TIME'
    }
  ];

  const bulkRes = await fetch(`${BASE_URL}/employees/bulk-import`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      rows: bulkRows,
      companyId: effectiveCompanyId
    })
  });
  const bulkData = await bulkRes.json();
  console.log('Bulk Import Status:', bulkRes.status, 'Successful Rows:', bulkData.data?.successful);
  if (bulkRes.status !== 200 || bulkData.data?.successful !== 2) {
    throw new Error(`Bulk import failed: ${JSON.stringify(bulkData)}`);
  }

  // 5. Export Employees
  console.log('5. Testing GET /api/v1/employees/export...');
  const exportRes = await fetch(`${BASE_URL}/employees/export?format=csv`, {
    headers: authHeaders
  });
  const exportData = await exportRes.json();
  console.log('Export Employees Status:', exportRes.status, 'Total Rows:', exportData.data?.totalRows);
  if (exportRes.status !== 200 || !exportData.data?.downloadUrl) {
    throw new Error(`Export employees failed: ${JSON.stringify(exportData)}`);
  }

  // 6. Get Employee Stats & Analytics
  console.log('6. Testing GET /api/v1/employees/stats and /analytics...');
  const statsRes = await fetch(`${BASE_URL}/employees/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  console.log('Employee Stats Status:', statsRes.status, 'Stats:', statsData.data);
  if (statsRes.status !== 200) {
    throw new Error(`Employee stats failed: ${JSON.stringify(statsData)}`);
  }

  const analyticsRes = await fetch(`${BASE_URL}/employees/analytics?startDate=2026-01-01&endDate=2026-12-31`, { headers: authHeaders });
  const analyticsData = await analyticsRes.json();
  console.log('Employee Analytics Status:', analyticsRes.status, 'Total:', analyticsData.data?.totalHeadcount);
  if (analyticsRes.status !== 200) {
    throw new Error(`Employee analytics failed: ${JSON.stringify(analyticsData)}`);
  }

  console.log('✅ ALL EMPLOYEE MODULE TESTS PASSED');
  return { createdEmployeeId, effectiveCompanyId, authHeaders };
}

export default runEmployeeTests;
