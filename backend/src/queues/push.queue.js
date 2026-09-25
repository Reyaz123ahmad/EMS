import { Queue } from 'bullmq';
import { defaultQueueOptions } from '../config/bullmq.js';

export const pushQueue = new Queue('push-queue', defaultQueueOptions);

export async function addPushNotification({ userId, title, body, data }) {
  return pushQueue.add('send-push', { userId, title, body, data });
}

export default pushQueue;
