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
  console.log('[EMAIL] Sending OTP to:', to);
  console.log('[EMAIL] OTP:', otp);
  console.log('[EMAIL] Provider:', env.SMTP_HOST || 'Gmail SMTP');

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

/**
 * Send Document Approval Email
 */
export async function sendDocumentApprovalEmail({ to, name, documentName, companyName }) {
  console.log('[EMAIL] Sending Document Approval Notification to:', to);
  const subject = `Document Approved: ${documentName || 'Verification Document'} - ${companyName || 'Mindstocs'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Document Verification Approved</h2>
      <p style="color: #475569; font-size: 14px;">Hello <strong>${name || 'Employee'}</strong>,</p>
      <p style="color: #475569; font-size: 14px;">Your submitted document <strong>${documentName || 'Document'}</strong> has been verified and <span style="color: #16a34a; font-weight: bold;">APPROVED</span> by your HR administration team.</p>
      <div style="margin: 20px 0; padding: 12px 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 6px;">
        <p style="margin: 0; color: #15803d; font-size: 13px;">Status: <strong>VERIFIED & APPROVED</strong></p>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Thank you,<br/>${companyName || 'Mindstocs'} HR Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

/**
 * Send Document Rejection Email
 */
export async function sendDocumentRejectionEmail({ to, name, documentName, rejectionReason, companyName }) {
  console.log('[EMAIL] Sending Document Rejection Notification to:', to);
  const subject = `Document Verification Rejected: ${documentName || 'Verification Document'} - ${companyName || 'Mindstocs'}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #0f172a; margin-bottom: 8px;">Document Verification Notice</h2>
      <p style="color: #475569; font-size: 14px;">Hello <strong>${name || 'Employee'}</strong>,</p>
      <p style="color: #475569; font-size: 14px;">Your submitted document <strong>${documentName || 'Document'}</strong> was reviewed and <span style="color: #dc2626; font-weight: bold;">REJECTED</span>.</p>
      <div style="margin: 20px 0; padding: 12px 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px;">
        <p style="margin: 0 0 6px 0; color: #991b1b; font-size: 13px;"><strong>Reason for Rejection:</strong></p>
        <p style="margin: 0; color: #b91c1c; font-size: 13px;">${rejectionReason || 'Document details were unclear or invalid. Please re-upload a clear copy.'}</p>
      </div>
      <p style="color: #475569; font-size: 13px;">Please log in to your employee portal to upload a revised copy of your document.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">Thank you,<br/>${companyName || 'Mindstocs'} HR Team</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

export default {
  sendEmail,
  sendOTPEmail,
  sendCredentialsEmail,
  sendWelcomeEmail,
  sendDocumentApprovalEmail,
  sendDocumentRejectionEmail
};
