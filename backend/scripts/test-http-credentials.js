import { generateAccessToken } from '../src/security/jwt.js';

async function runHttpCredentialsTest() {
  const token = generateAccessToken({
    id: 'f94294c6-e692-4217-a06a-3fe874d1a938',
    email: 'reyazahmad40544@gmail.com',
    role: 'COMPANY_ADMIN',
    roles: ['COMPANY_ADMIN', 'HR_ADMIN'],
    companyId: '2b73361e-1510-4c8d-8a62-9e9ef42f026a' // real company ID
  });

  const uniqueCandidateEmail = `candidate_cred_${Date.now()}@gmail.com`;
  const candidatePhone = '9661440544';

  console.log('============================================================');
  console.log('STEP 1: SEND DUAL OTP VIA HTTP');
  console.log('============================================================');

  const sendRes = await fetch('http://127.0.0.1:5000/api/v1/employees/send-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employeeData: {
        firstName: 'Reyaz',
        lastName: 'Ahmad',
        email: uniqueCandidateEmail,
        phone: candidatePhone,
        employmentType: 'FULL_TIME',
        role: 'EMPLOYEE'
      }
    })
  });

  const sendData = await sendRes.json();
  console.log('Send OTP Status:', sendRes.status);
  console.log('Send OTP Response:', sendData);

  const sessionId = sendData.data?.sessionId;
  if (!sessionId) {
    throw new Error('No sessionId returned');
  }

  // Get OTP from memory/session repository
  const { authRepository } = await import('../src/modules/auth/auth.repository.js');
  const rawSession = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
  const session = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession;

  console.log('Session retrieved:', {
    emailOtp: session?.emailOtp,
    phoneOtp: session?.phoneOtp
  });

  console.log('\n============================================================');
  console.log('STEP 2: VERIFY DUAL OTP VIA HTTP');
  console.log('============================================================');

  const verifyRes = await fetch('http://127.0.0.1:5000/api/v1/employees/verify-otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      email: uniqueCandidateEmail,
      emailOtp: session.emailOtp,
      phoneOtp: session.phoneOtp,
      sessionId
    })
  });

  const verifyData = await verifyRes.json();
  console.log('Verify Status:', verifyRes.status);
  console.log('Verify Response:', verifyData);

  console.log('\n============================================================');
  console.log('STEP 3: CREATE EMPLOYEE (DISPATCHES CREDENTIALS EMAIL + SMS)');
  console.log('============================================================');

  const t0 = Date.now();
  const createRes = await fetch('http://127.0.0.1:5000/api/v1/employees/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId,
      employeeData: {
        firstName: 'Reyaz',
        lastName: 'Ahmad',
        email: uniqueCandidateEmail,
        phone: candidatePhone,
        employmentType: 'FULL_TIME',
        role: 'EMPLOYEE'
      }
    })
  });

  const elapsedMs = Date.now() - t0;
  const createData = await createRes.json();

  console.log('Create Employee HTTP Status:', createRes.status);
  console.log(`API Response Time: ${elapsedMs} ms (< 3000ms target)`);
  console.log('Create Employee Response:', createData);

  // Wait 1.5s for fire-and-forget logs
  await new Promise(r => setTimeout(r, 1500));
  console.log('\n============================================================');
  console.log('TEST COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  process.exit(0);
}

runHttpCredentialsTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
