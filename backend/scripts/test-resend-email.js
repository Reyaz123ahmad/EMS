import { sendEmail, sendOTPEmail, sendCredentialsEmail, sendPasswordResetEmail } from '../src/services/email.service.js';

async function testResend() {
  console.log('============================================================');
  console.log('TESTING RESEND EMAIL DISPATCH');
  console.log('============================================================');

  console.log('\n--- Test 1: sendOTPEmail ---');
  const otpRes = await sendOTPEmail({
    to: 'delivered@resend.dev',
    name: 'Reyaz Ahmad',
    otp: '123456',
    purpose: 'EMPLOYEE_CREATE',
    expiryMinutes: 15,
    companyName: 'Mindstocs Tech'
  });
  console.log('OTP Email Result:', otpRes);

  console.log('\n--- Test 2: sendCredentialsEmail ---');
  const credsRes = await sendCredentialsEmail({
    to: 'delivered@resend.dev',
    name: 'Reyaz Ahmad',
    email: 'reyaz@example.com',
    password: 'TempPassword@2026!',
    role: 'HR_MANAGER',
    companyName: 'Mindstocs Tech',
    employeeCode: 'EMP001',
    department: 'Engineering',
    loginUrl: 'http://localhost:3000/login'
  });
  console.log('Credentials Email Result:', credsRes);

  console.log('\n--- Test 3: sendPasswordResetEmail ---');
  const resetRes = await sendPasswordResetEmail('delivered@resend.dev', {
    otp: '654321',
    name: 'Reyaz Ahmad',
    companyName: 'Mindstocs Tech'
  });
  console.log('Password Reset Email Result:', resetRes);

  console.log('\n============================================================');
  console.log('RESEND TESTS COMPLETE');
  console.log('============================================================');
}

testResend().catch(err => {
  console.error('Test execution error:', err);
});
