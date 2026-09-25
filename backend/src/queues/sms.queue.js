import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

export const smsQueue = new Queue('sms-queue', defaultQueueOptions);

export async function addOTPSMS({ to, otp }) {
  return smsQueue.add('send-otp', { to, otp });
}

export async function addAlertSMS({ to, message }) {
  return smsQueue.add('send-alert', { to, message });
}

export default smsQueue;
