import { Resend } from 'resend';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getOTPEmailTemplate } from './templates/otp.template.js';
import { getCredentialsEmailTemplate } from './templates/credentials.template.js';
import { getWelcomeEmailTemplate } from './templates/welcome.template.js';

const resend = new Resend(env.RESEND_API_KEY || process.env.RESEND_API_KEY);

const FROM_EMAIL = env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = env.RESEND_FROM_NAME || process.env.RESEND_FROM_NAME || 'EMS Platform';
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`;

/**
 * Core generic send email method using Resend
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 * @returns {Promise<Object>}
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>?/gm, '')
    });

    if (error) {
      console.error('[EMAIL] Resend error:', error);
      logger.error({ error, to, subject }, '[EMAIL] Resend error');
      throw new Error(error.message || 'Email send failed');
    }

    console.log('[EMAIL] Sent:', data?.id, 'to:', to);
    logger.info({ id: data?.id, to, subject }, '[EMAIL] Sent successfully via Resend');
    return { success: true, id: data?.id, messageId: data?.id };
  } catch (err) {
    console.error('[EMAIL] Send failed:', err.message);
    logger.error({ error: err.message, to, subject }, '[EMAIL] Send failed');
    return { success: false, error: err.message };
  }
}

/**
 * Send OTP Verification Email (Supports both object & positional args)
 */
export async function sendOTPEmail(optionsOrTo, maybeOtp) {
  let to, name, otp, purpose, expiryMinutes, companyName;
  if (typeof optionsOrTo === 'string') {
    to = optionsOrTo;
    otp = maybeOtp;
    name = 'Valued User';
  } else {
    ({ to, name, otp, purpose, expiryMinutes = 10, companyName } = optionsOrTo || {});
  }

  console.log('[EMAIL] Sending OTP to:', to);
  console.log('[EMAIL] OTP:', otp);
  console.log('[EMAIL] Provider: Resend');

  const html = getOTPEmailTemplate({
    name: name || 'Valued User',
    otp,
    purpose: purpose || 'Verification',
    expiryMinutes,
    companyName: companyName || 'Mindstocs EMS'
  });
  const subject = `Your Verification Code: ${otp} - ${companyName || 'Mindstocs EMS'}`;
  return sendEmail({ to, subject, html });
}

export const sendOtpEmail = sendOTPEmail;

/**
 * Send Account Credentials Email (Supports both object & positional args)
 */
export async function sendCredentialsEmail(optionsOrTo, maybeOptions) {
  let to, name, email, password, role, companyName, employeeCode, department, loginUrl;
  if (typeof optionsOrTo === 'string') {
    to = optionsOrTo;
    ({ email, password, role, companyName, employeeCode, department, loginUrl, name } = maybeOptions || {});
  } else {
    ({ to, name, email, password, role, companyName, employeeCode, department, loginUrl } = optionsOrTo || {});
  }

  const html = getCredentialsEmailTemplate({
    name: name || 'Employee',
    email: email || to,
    password,
    role: role || 'EMPLOYEE',
    companyName: companyName || 'Mindstocs EMS',
    employeeCode,
    department,
    loginUrl: loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
  });
  const subject = `Welcome to ${companyName || 'Mindstocs EMS'} - Account Credentials`;
  return sendEmail({ to, subject, html });
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(to, { otp, name, companyName, expiryMinutes = 10 } = {}) {
  return sendOTPEmail({
    to,
    name,
    otp,
    purpose: 'Password Reset',
    expiryMinutes,
    companyName
  });
}

/**
 * Send Welcome Email
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
  sendOtpEmail,
  sendCredentialsEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendDocumentApprovalEmail,
  sendDocumentRejectionEmail
};
