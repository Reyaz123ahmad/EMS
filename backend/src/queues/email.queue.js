import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';
import * as emailService from '../integrations/email/email.service.js';

export const emailQueue = new Queue('email-queue', defaultQueueOptions);

/**
 * Add OTP Email Job
 */
export async function addOTPEmail({ to, name, otp, purpose, expiryMinutes = 10, companyName }) {
  try {
    const result = await emailService.sendOTPEmail({ to, name, otp, purpose, expiryMinutes, companyName });
    return result;
  } catch (err) {
    return { success: false, error: err?.message };
  }
}

/**
 * Add Credentials Email Job
 */
export async function addCredentialsEmail({
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
  try {
    return await emailService.sendCredentialsEmail({
      to,
      name,
      email,
      password,
      role,
      companyName,
      employeeCode,
      department,
      loginUrl
    });
  } catch (err) {
    return { success: false, error: err?.message };
  }
}

/**
 * Add Welcome Email Job
 */
export async function addWelcomeEmail({ to, name, companyName, role, loginUrl }) {
  return emailQueue.add('send-welcome', {
    to,
    name,
    companyName,
    role,
    loginUrl
  });
}

/**
 * Add General Notification Email Job
 */
export async function addNotificationEmail({ to, subject, body, html }) {
  return emailQueue.add('send-notification', {
    to,
    subject,
    body,
    html: html || body
  });
}

export default emailQueue;
