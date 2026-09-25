import { Worker } from 'bullmq';
import { connection } from '../config/bullmq.js';
import logger from '../config/logger.js';
import emailService from '../integrations/email/email.service.js';
import { refundRequestedTemplate } from '../integrations/email/templates/refund-requested.template.js';
import { refundApprovedTemplate } from '../integrations/email/templates/refund-approved.template.js';
import { refundRejectedTemplate } from '../integrations/email/templates/refund-rejected.template.js';
import { refundProcessedTemplate } from '../integrations/email/templates/refund-processed.template.js';
import { paymentFailedTemplate } from '../integrations/email/templates/payment-failed.template.js';
import { paymentRetryTemplate } from '../integrations/email/templates/payment-retry.template.js';
import { subscriptionExpiringTemplate } from '../integrations/email/templates/subscription-expiring.template.js';
import { subscriptionExpiredTemplate } from '../integrations/email/templates/subscription-expired.template.js';
import { trialEndingTemplate } from '../integrations/email/templates/trial-ending.template.js';
import { trialEndedTemplate } from '../integrations/email/templates/trial-ended.template.js';
import { invoiceGeneratedTemplate } from '../integrations/email/templates/invoice-generated.template.js';
import { dunningReminderTemplate } from '../integrations/email/templates/dunning-reminder.template.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Processing email job');

    const { name, data } = job;

    switch (name) {
      case 'send-otp': {
        const { to, name: recipientName, otp, purpose, expiryMinutes, companyName } = data;
        return await emailService.sendOTPEmail({
          to,
          name: recipientName,
          otp,
          purpose,
          expiryMinutes,
          companyName,
        });
      }
      case 'send-credentials': {
        const {
          to,
          name: recipientName,
          email,
          password,
          role,
          companyName,
          employeeCode,
          department,
          loginUrl,
        } = data;
        return await emailService.sendCredentialsEmail({
          to,
          name: recipientName,
          email,
          password,
          role,
          companyName,
          employeeCode,
          department,
          loginUrl,
        });
      }
      case 'send-welcome': {
        const { to, name: recipientName, companyName, role, loginUrl } = data;
        return await emailService.sendWelcomeEmail({
          to,
          name: recipientName,
          companyName,
          role,
          loginUrl,
        });
      }
      case 'send-notification': {
        const { to, subject, html, body } = data;
        return await emailService.sendEmail({
          to,
          subject,
          html: html || body,
          text: body,
        });
      }
      case 'send-refund-requested': {
        const tpl = refundRequestedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-refund-approved': {
        const tpl = refundApprovedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-refund-rejected': {
        const tpl = refundRejectedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-refund-processed': {
        const tpl = refundProcessedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-payment-failed': {
        const tpl = paymentFailedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-payment-retry': {
        const tpl = paymentRetryTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-subscription-expiring': {
        const tpl = subscriptionExpiringTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-subscription-expired': {
        const tpl = subscriptionExpiredTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-trial-ending': {
        const tpl = trialEndingTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-trial-ended': {
        const tpl = trialEndedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-invoice-generated': {
        const tpl = invoiceGeneratedTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      case 'send-dunning-reminder': {
        const tpl = dunningReminderTemplate(data);
        return await emailService.sendEmail({ to: data.to, ...tpl });
      }
      default:
        throw new Error(`Unknown email job type: ${name}`);
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id, jobName: job.name }, 'Email job completed successfully');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err: err.message }, 'Email job failed');
});

export default emailWorker;
