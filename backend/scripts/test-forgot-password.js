import prisma from '../src/config/prisma.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { authRepository } from '../src/modules/auth/auth.repository.js';
import { comparePassword, hashPassword } from '../src/security/password.js';
import bcrypt from 'bcryptjs';

async function runTest() {
  console.log('============================================================');
  console.log('STARTING FORGOT PASSWORD & LOGIN REPRODUCTION TEST');
  console.log('============================================================');

  // 1. Find an active test user
  const user = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, email: true, passwordHash: true, updatedAt: true }
  });

  if (!user) {
    console.error('No active user found in database.');
    process.exit(1);
  }

  const testEmail = user.email;
  const originalHash = user.passwordHash;
  const originalUpdatedAt = user.updatedAt;

  console.log('\n[PHASE 1] Initial DB State:');
  console.log('User ID:', user.id);
  console.log('Email:', testEmail);
  console.log('Original passwordHash prefix:', originalHash.substring(0, 10));
  console.log('Original updatedAt:', originalUpdatedAt);

  // 2. Trigger forgotPassword (this puts user in _userEmailCache)
  console.log('\n[PHASE 2] Triggering forgotPassword...');
  const forgotResult = await authService.forgotPassword({ email: testEmail });
  console.log('forgotPassword result:', forgotResult);

  // 3. Retrieve generated OTP from repository
  const otpRecord = await authRepository.getOTP(testEmail, 'PASSWORD_RESET');
  console.log('Retrieved OTP record for reset:', otpRecord);
  const otp = otpRecord.otp;

  // 4. Perform resetPassword with new test password
  const newTestPassword = 'NewPassword@2026!';
  console.log('\n[PHASE 3] Calling resetPassword with new password:', newTestPassword);
  const resetResult = await authService.resetPassword({
    email: testEmail,
    otp,
    newPassword: newTestPassword
  });
  console.log('resetPassword result:', resetResult);

  // 5. Inspect DB directly
  const updatedUserInDb = await prisma.user.findUnique({
    where: { email: testEmail },
    select: { id: true, email: true, passwordHash: true, updatedAt: true }
  });

  console.log('\n[PHASE 4] DB State After Reset:');
  console.log('New passwordHash prefix:', updatedUserInDb.passwordHash.substring(0, 10));
  console.log('New updatedAt:', updatedUserInDb.updatedAt);
  console.log('Hash changed in DB?:', originalHash !== updatedUserInDb.passwordHash);
  console.log('Is valid bcrypt?:', updatedUserInDb.passwordHash.startsWith('$2a$') || updatedUserInDb.passwordHash.startsWith('$2b$'));

  // 6. Test direct bcrypt comparison
  const bcryptMatch = await bcrypt.compare(newTestPassword, updatedUserInDb.passwordHash);
  console.log('Direct bcrypt.compare match:', bcryptMatch);

  // 7. Test authService.login with NEW password immediately (checking cache bust)
  console.log('\n[PHASE 5] Testing immediate login with NEW password...');
  let loginSuccess = false;
  try {
    const loginResult = await authService.login({
      email: testEmail,
      password: newTestPassword,
      userAgent: 'TestAgent/1.0',
      ipAddress: '127.0.0.1'
    });
    console.log('Login with NEW password SUCCESS! User ID:', loginResult?.user?.id || loginResult?.requires2FA);
    loginSuccess = true;
  } catch (err) {
    console.error('Login with NEW password FAILED:', err.message);
  }

  // 8. Test authService.login with OLD password (should fail)
  console.log('\n[PHASE 6] Testing login with OLD invalid password...');
  let oldPasswordRejected = false;
  try {
    await authService.login({
      email: testEmail,
      password: 'OldWrongPassword!999',
      userAgent: 'TestAgent/1.0',
      ipAddress: '127.0.0.1'
    });
    console.error('Login with OLD password unexpectedly succeeded!');
  } catch (err) {
    console.log('Login with OLD password correctly REJECTED:', err.message);
    oldPasswordRejected = true;
  }

  // 9. Restore original password hash in DB
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: originalHash }
  });
  authRepository.clearUserCache(testEmail);
  console.log('\n[PHASE 7] Restored original password hash for test user.');

  console.log('\n============================================================');
  console.log('SUMMARY OF TEST RESULTS:');
  console.log('- Hash Changed in DB:', originalHash !== updatedUserInDb.passwordHash ? 'PASS' : 'FAIL');
  console.log('- Is Valid Bcrypt:', (updatedUserInDb.passwordHash.startsWith('$2a$') || updatedUserInDb.passwordHash.startsWith('$2b$')) ? 'PASS' : 'FAIL');
  console.log('- Bcrypt Compare:', bcryptMatch ? 'PASS' : 'FAIL');
  console.log('- Login with NEW password:', loginSuccess ? 'PASS' : 'FAIL');
  console.log('- Old Password Rejected:', oldPasswordRejected ? 'PASS' : 'FAIL');
  console.log('============================================================');

  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
