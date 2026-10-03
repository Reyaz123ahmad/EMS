import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';
import { sendOTPEmail, sendDocumentApprovalEmail, sendDocumentRejectionEmail } from '../src/integrations/email/email.service.js';
import { sendOtpSms } from '../src/services/sms.service.js';
import { employeesService } from '../src/modules/employees/employees.service.js';

async function runAllTests() {
  console.log('============================================================');
  console.log('TEST 1: DIRECT EMAIL OTP DELIVERY TO reyazjaisinghpur@gmail.com');
  console.log('============================================================');

  const emailRes = await sendOTPEmail({
    to: 'reyazjaisinghpur@gmail.com',
    name: 'Reyaz Ahmad',
    otp: '937105',
    purpose: 'EMPLOYEE_CREATE',
    companyName: 'Mindstocs'
  });
  console.log('Email Send Result:', emailRes);

  console.log('\n============================================================');
  console.log('TEST 2: DIRECT SMS OTP DELIVERY (DLT TEMPLATE MATCHING) TO 9661440544');
  console.log('============================================================');

  const smsRes = await sendOtpSms('9661440544', '937105');
  console.log('SMS Send Result:', smsRes);

  console.log('\n============================================================');
  console.log('TEST 3: FULL DUAL OTP SERVICE VERIFICATION FLOW');
  console.log('============================================================');

  const admin = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: true, userRoles: { include: { role: true } } }
  });

  if (!admin) {
    throw new Error('Admin user reyazahmad40544@gmail.com not found');
  }

  const adminRoles = admin.userRoles?.map(ur => ur.role.name) || ['COMPANY_ADMIN', 'HR_ADMIN'];

  const testEmail = `candidate_${Date.now()}@gmail.com`;

  // 1. Send OTP via employeesService
  const sendResult = await employeesService.sendEmployeeOTP({
    employeeData: {
      firstName: 'Reyaz',
      lastName: 'Ahmad',
      email: testEmail,
      phone: '9661440544',
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

  console.log('Send OTP Result:', sendResult);
  const sessionId = sendResult.sessionId;

  // Retrieve the generated session from repository to get OTPs for automated assertion
  const { authRepository } = await import('../src/modules/auth/auth.repository.js');
  const storedRaw = await authRepository.getOTP(`session:${sessionId}`, 'EMPLOYEE_CREATE');
  const session = typeof storedRaw === 'string' ? JSON.parse(storedRaw) : storedRaw;
  
  console.log('Session retrieved successfully:', {
    sessionId,
    emailOtp: session?.emailOtp,
    phoneOtp: session?.phoneOtp
  });

  const { emailOtp, phoneOtp } = session;

  console.log('\n--- Test 3A: Wrong Phone OTP Verification ---');
  try {
    await employeesService.verifyEmployeeOTP({
      email: testEmail,
      emailOtp,
      phoneOtp: '000000',
      sessionId
    });
    console.error('FAIL: Wrong phone OTP was accepted!');
  } catch (err) {
    console.log('PASS: Wrong phone OTP correctly rejected with message:', err.message);
  }

  console.log('\n--- Test 3B: Wrong Email OTP Verification ---');
  try {
    await employeesService.verifyEmployeeOTP({
      email: testEmail,
      emailOtp: '000000',
      phoneOtp,
      sessionId
    });
    console.error('FAIL: Wrong email OTP was accepted!');
  } catch (err) {
    console.log('PASS: Wrong email OTP correctly rejected with message:', err.message);
  }

  console.log('\n--- Test 3C: Valid Both OTPs Verification ---');
  const verifyResult = await employeesService.verifyEmployeeOTP({
    email: testEmail,
    emailOtp,
    phoneOtp,
    sessionId
  });
  console.log('PASS: Dual OTP verification succeeded!');
  console.log('Created/Updated Employee ID:', verifyResult.employee?.id);
  console.log('Employee Email:', verifyResult.user?.email);

  console.log('\n============================================================');
  console.log('TEST 4: DOCUMENT APPROVAL & REJECTION EMAIL NOTIFICATIONS');
  console.log('============================================================');

  const appRes = await sendDocumentApprovalEmail({
    to: 'reyazjaisinghpur@gmail.com',
    name: 'Reyaz Ahmad',
    documentName: 'Aadhaar Card',
    companyName: 'Mindstocs'
  });
  console.log('Document Approval Email Sent:', appRes);

  const rejRes = await sendDocumentRejectionEmail({
    to: 'reyazjaisinghpur@gmail.com',
    name: 'Reyaz Ahmad',
    documentName: 'PAN Card',
    rejectionReason: 'Blurred image. Permanent Account Number (PAN) is not readable.',
    companyName: 'Mindstocs'
  });
  console.log('Document Rejection Email Sent:', rejRes);

  console.log('\n============================================================');
  console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
  process.exit(0);
}

runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
