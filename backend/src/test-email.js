import { sendOTPEmail } from './integrations/email/email.service.js';
import { verifySMTPConnection } from './integrations/email/email.client.js';
import env from './config/env.js';
import logger from './config/logger.js';

async function testEmail() {
  logger.info('Testing SMTP connection...');
  const isVerified = await verifySMTPConnection();
  if (!isVerified) {
    logger.error('SMTP connection failed verification');
    return;
  }

  logger.info(`Sending test OTP email to ${env.SUPER_ADMIN_EMAIL}...`);
  const result = await sendOTPEmail({
    to: env.SUPER_ADMIN_EMAIL,
    name: 'Super Admin',
    otp: '984521',
    purpose: 'Initial EMS Verification Test',
    expiryMinutes: 10
  });

  logger.info({ result }, 'Test OTP email sent successfully!');
}

testEmail().catch((err) => {
  logger.error({ err }, 'Error in email test script');
  process.exit(1);
});
