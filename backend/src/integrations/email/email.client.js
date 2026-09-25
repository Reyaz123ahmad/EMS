import nodemailer from 'nodemailer';
import env from '../../config/env.js';
import logger from '../../config/logger.js';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD
  }
});

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>}
 */
export async function verifySMTPConnection() {
  try {
    await transporter.verify();
    logger.info('SMTP transporter verified successfully');
    return true;
  } catch (error) {
    logger.error({ error }, 'SMTP transporter verification failed');
    return false;
  }
}

export default transporter;
