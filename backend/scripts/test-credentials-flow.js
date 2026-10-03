import prisma from '../src/config/prisma.js';
import { employeesService } from '../src/modules/employees/employees.service.js';
import { sendSms } from '../src/services/sms.service.js';
import authRepository from '../src/modules/auth/auth.repository.js';

async function runCredentialsTests() {
  console.log('============================================================');
  console.log('TEST 1: DIRECT sendSms FUNCTION DISPATCH');
  console.log('============================================================');

  const testMessage = 'Welcome to Mindstocs! Your login credentials are: Email: user@example.com Password: TempPassword123 Login: http://localhost:3000/login';
  const smsRes = await sendSms('9661440544', testMessage);
  console.log('Direct sendSms Result:', smsRes);

  console.log('\n============================================================');
  console.log('TEST 2: COMPLETE EMPLOYEE ONBOARDING WITH EMAIL + SMS CREDENTIALS');
  console.log('============================================================');

  const admin = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: true, userRoles: { include: { role: true } } }
  });

  if (!admin) {
    throw new Error('Admin reyazahmad40544@gmail.com not found');
  }

  const adminRoles = admin.userRoles?.map(ur => ur.role.name) || ['COMPANY_ADMIN', 'HR_ADMIN'];
  const testCandidateEmail = `candidate_cred_${Date.now()}@gmail.com`;
  const testCandidatePhone = '9661440544';

  // Step 1: Send OTP
  const sendRes = await employeesService.sendEmployeeOTP({
    employeeData: {
      firstName: 'Reyaz',
      lastName: 'Ahmad',
      email: testCandidateEmail,
      phone: testCandidatePhone,
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE'
    },
    companyId: admin.companyId,
    reqUser: {
      ...admin,
      role: adminRoles[0] || 'COMPANY_ADMIN',
      roles: adminRoles
    }
  });

  const sessionId = sendRes.sessionId;
  const rawSession = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
  const session = typeof rawSession === 'string' ? JSON.parse(rawSession) : rawSession;

  // Step 2: Verify OTP
  await employeesService.verifyEmployeeOTP({
    email: testCandidateEmail,
    emailOtp: session.emailOtp,
    phoneOtp: session.phoneOtp,
    sessionId
  });
  console.log('Step 2 Verified successfully!');

  // Step 3: Create Employee & Provision User Portal Access
  const t0 = Date.now();
  const createRes = await employeesService.createEmployeeWithUser({
    sessionId,
    employeeData: {
      firstName: 'Reyaz',
      lastName: 'Ahmad',
      email: testCandidateEmail,
      phone: testCandidatePhone,
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE'
    },
    companyId: admin.companyId,
    createdBy: admin.id,
    reqUser: {
      ...admin,
      role: adminRoles[0] || 'COMPANY_ADMIN',
      roles: adminRoles
    }
  });
  const elapsedMs = Date.now() - t0;

  console.log(`\nEmployee Creation Completed in ${elapsedMs} ms`);
  console.log('Created Employee ID:', createRes.employee?.id);
  console.log('Created User ID:', createRes.user?.id);
  console.log('Provisioning Message:', createRes.message);

  console.log('\n============================================================');
  console.log('TEST 3: EMPLOYEE CREATION WITHOUT PHONE (EMAIL ONLY GRACEFUL FALLBACK)');
  console.log('============================================================');

  const noPhoneEmail = `candidate_nophone_${Date.now()}@gmail.com`;
  const sendNoPhone = await employeesService.sendEmployeeOTP({
    employeeData: {
      firstName: 'NoPhone',
      lastName: 'Candidate',
      email: noPhoneEmail,
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE'
    },
    companyId: admin.companyId,
    reqUser: {
      ...admin,
      role: adminRoles[0] || 'COMPANY_ADMIN',
      roles: adminRoles
    }
  });

  const rawNoPhoneSession = await authRepository.getOTP(`session:${sendNoPhone.sessionId}`, 'EMPLOYEE_CREATE');
  const noPhoneSession = typeof rawNoPhoneSession === 'string' ? JSON.parse(rawNoPhoneSession) : rawNoPhoneSession;

  await employeesService.verifyEmployeeOTP({
    email: noPhoneEmail,
    emailOtp: noPhoneSession.emailOtp,
    sessionId: sendNoPhone.sessionId
  });

  const createNoPhoneRes = await employeesService.createEmployeeWithUser({
    sessionId: sendNoPhone.sessionId,
    employeeData: {
      firstName: 'NoPhone',
      lastName: 'Candidate',
      email: noPhoneEmail,
      employmentType: 'FULL_TIME',
      role: 'EMPLOYEE'
    },
    companyId: admin.companyId,
    createdBy: admin.id,
    reqUser: {
      ...admin,
      role: adminRoles[0] || 'COMPANY_ADMIN',
      roles: adminRoles
    }
  });

  console.log('No-phone employee created cleanly without SMS error:', createNoPhoneRes.employee?.id);

  // Wait 1.5s for fire-and-forget logs to output
  await new Promise(r => setTimeout(r, 1500));
  console.log('\n============================================================');
  console.log('ALL CREDENTIALS DISPATCH TESTS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  process.exit(0);
}

runCredentialsTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
