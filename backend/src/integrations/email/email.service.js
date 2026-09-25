import transporter from './email.client.js';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getOTPEmailTemplate } from './templates/otp.template.js';
import { getCredentialsEmailTemplate } from './templates/credentials.template.js';
import { getWelcomeEmailTemplate } from './templates/welcome.template.js';

/**
 * Core generic send email method
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @returns {Promise<Object>}
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const fromAddress = `"${env.SMTP_FROM_NAME || 'Mindstocs'}" <${env.SMTP_FROM || env.SMTP_USER}>`;
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '')
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to, subject }, 'Email sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error: error.message, to, subject }, 'Failed to send email');
    throw error;
  }
}

/**
 * Send OTP Verification Email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.name
 * @param {string} options.otp
 * @param {string} [options.purpose]
 * @param {number} [options.expiryMinutes=10]
 * @param {string} [options.companyName]
 * @returns {Promise<Object>}
 */
export async function sendOTPEmail({ to, name, otp, purpose, expiryMinutes = 10, companyName }) {
  const html = getOTPEmailTemplate({ name, otp, purpose, expiryMinutes, companyName });
  const subject = `Your Verification Code: ${otp} - ${companyName || 'Mindstocs EMS'}`;
  return sendEmail({ to, subject, html });
}

/**
 * Send Account Credentials Email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.name
 * @param {string} options.email
 * @param {string} options.password
 * @param {string} options.role
 * @param {string} [options.companyName]
 * @param {string} [options.employeeCode]
 * @param {string} [options.department]
 * @param {string} [options.loginUrl]
 * @returns {Promise<Object>}
 */
export async function sendCredentialsEmail({
  to,
  name,
  email,
  password,
  role,
  companyName,
  employeeCode,
  department,
  loginUrl
}) {
  const html = getCredentialsEmailTemplate({
    name,
    email,
    password,
    role,
    companyName,
    employeeCode,
    department,
    loginUrl
  });
  const subject = `Welcome to ${companyName || 'Mindstocs EMS'} - Account Credentials`;
  return sendEmail({ to, subject, html });
}

/**
 * Send Welcome Email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.name
 * @param {string} [options.companyName]
 * @param {string} [options.role]
 * @param {string} [options.loginUrl]
 * @returns {Promise<Object>}
 */
export async function sendWelcomeEmail({ to, name, companyName, role, loginUrl }) {
  const html = getWelcomeEmailTemplate({ name, companyName, role, loginUrl });
  const subject = `Welcome to ${companyName || 'Mindstocs EMS'}`;
  return sendEmail({ to, subject, html });
}

export default {
  sendEmail,
  sendOTPEmail,
  sendCredentialsEmail,
  sendWelcomeEmail
};
