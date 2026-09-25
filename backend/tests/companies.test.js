import { prisma } from '../src/config/prisma.js';
import authRepository from '../src/modules/auth/auth.repository.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runCompanyTests() {
  console.log('\n--- [1/5] STARTING COMPANIES MODULE TEST SUITE ---');

  let superAdminUser = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!superAdminUser) {
    throw new Error('No test user found in database');
  }

  const token = generateAccessToken({
    id: superAdminUser.id,
    sub: superAdminUser.id,
    userId: superAdminUser.id,
    email: superAdminUser.email,
    role: 'SUPER_ADMIN',
    companyId: superAdminUser.companyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const testSuffix = Date.now();
  const testEmail = `admin_${testSuffix}@acme${testSuffix}.com`;
  const companyName = `Acme Enterprise ${testSuffix}`;

  // 1. Send Company OTP (Full payload)
  console.log('1. Testing POST /api/v1/companies/send-otp (Full Payload)...');
  const sendOtpPayload = {
    companyData: {
      name: companyName,
      domain: `acme${testSuffix}.com`,
      email: `contact@acme${testSuffix}.com`,
      phone: '+1 555 019 2831',
      address: '742 Evergreen Terrace, Suite 100',
      country: 'USA',
      timezone: 'America/New_York',
      currency: 'USD'
    },
    adminData: {
      firstName: 'Jonathan',
      lastName: 'Doe',
      email: testEmail,
      phone: '+1 555 019 8899'
    }
  };

  const otpRes = await fetch(`${BASE_URL}/companies/send-otp`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(sendOtpPayload)
  });

  const otpData = await otpRes.json();
  console.log('Send Company OTP Status:', otpRes.status, 'Session ID:', otpData.data?.sessionId);
  if (otpRes.status !== 200 || !otpData.data?.sessionId) {
    throw new Error(`Send Company OTP failed: ${JSON.stringify(otpData)}`);
  }

  const sessionId = otpData.data.sessionId;

  // 2. Verify OTP (Negative test: Invalid OTP)
  console.log('2. Testing POST /api/v1/companies/verify-otp (Invalid OTP - Negative Test)...');
  const badVerifyRes = await fetch(`${BASE_URL}/companies/verify-otp`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      sessionId
    })
  });
  const badVerifyData = await badVerifyRes.json();
  console.log('Bad OTP Response (Expected 400):', badVerifyRes.status);
  if (badVerifyRes.status !== 400) {
    throw new Error('Expected 400 for invalid OTP');
  }

  // 3. Verify OTP (Valid test: Fetch actual OTP stored in Redis session)
  console.log('3. Testing POST /api/v1/companies/verify-otp (Valid OTP)...');
  const sessionRaw = await authRepository.getOTP(`session:${sessionId}`, 'COMPANY_ADMIN_CREATE');
  let parsed = typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;
  if (parsed && typeof parsed.otp === 'string' && parsed.otp.startsWith('{')) {
    try {
      parsed = JSON.parse(parsed.otp);
    } catch (e) {}
  }
  const validOtp = parsed?.otp || '123456';

  const verifyRes = await fetch(`${BASE_URL}/companies/verify-otp`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: testEmail,
      otp: validOtp,
      sessionId
    })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify OTP Status:', verifyRes.status, 'Verified:', verifyData.data?.verified);
  if (verifyRes.status !== 200 || !verifyData.data?.verified) {
    throw new Error(`Verify Company OTP failed: ${JSON.stringify(verifyData)}`);
  }

  // 4. Create Company with Admin (Finalize step)
  console.log('4. Testing POST /api/v1/companies/create (Complete 2-Step Registration)...');
  const createCompRes = await fetch(`${BASE_URL}/companies/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sessionId,
      companyData: sendOtpPayload.companyData,
      adminData: sendOtpPayload.adminData
    })
  });
  const createCompData = await createCompRes.json();
  console.log('Create Company Status:', createCompRes.status, 'Company ID:', createCompData.data?.company?.id);
  if (createCompRes.status !== 201 || !createCompData.data?.company?.id) {
    throw new Error(`Create company failed: ${JSON.stringify(createCompData)}`);
  }

  const createdCompanyId = createCompData.data.company.id;

  // 5. Get Company Stats
  console.log('5. Testing GET /api/v1/companies/stats...');
  const statsRes = await fetch(`${BASE_URL}/companies/stats`, {
    headers: authHeaders
  });
  const statsData = await statsRes.json();
  console.log('Company Stats Status:', statsRes.status, 'Stats:', statsData.data);
  if (statsRes.status !== 200) {
    throw new Error(`Get company stats failed: ${JSON.stringify(statsData)}`);
  }

  // 6. Get Company Analytics
  console.log('6. Testing GET /api/v1/companies/analytics...');
  const analyticsRes = await fetch(`${BASE_URL}/companies/analytics?startDate=2026-01-01&endDate=2026-12-31`, {
    headers: authHeaders
  });
  const analyticsData = await analyticsRes.json();
  console.log('Company Analytics Status:', analyticsRes.status, 'Data:', analyticsData.data);
  if (analyticsRes.status !== 200) {
    throw new Error(`Get company analytics failed: ${JSON.stringify(analyticsData)}`);
  }

  console.log('✅ ALL COMPANY MODULE TESTS PASSED');
  return { createdCompanyId, superAdminUser, token };
}

export default runCompanyTests;
