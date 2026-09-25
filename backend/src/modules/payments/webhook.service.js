import crypto from 'crypto';
import prisma from '../../config/prisma.js';

export function verifyWebhookSignature(payload, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_key_123';
  if (!signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  return expectedSignature === signature;
}

export async function processWebhookEvent(event, payload) {
  const data = payload?.payload?.payment?.entity || payload?.payload?.subscription?.entity || payload?.payload?.refund?.entity || {};

  switch (event) {
    case 'payment.authorized':
    case 'payment.captured': {
      const orderId = data.order_id;
      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            status: 'SUCCESS',
            razorpayPaymentId: data.id,
            metadata: data,
          },
        });
      }
      break;
    }

    case 'payment.failed': {
      const orderId = data.order_id;
      if (orderId) {
        await prisma.paymentTransaction.updateMany({
          where: { razorpayOrderId: orderId },
          data: {
            status: 'FAILED',
            metadata: data,
          },
        });
      }
      break;
    }

    case 'subscription.charged': {
      const subId = data.id;
      // update subscription active status
      break;
    }

    case 'subscription.cancelled': {
      // update subscription cancelled
      break;
    }

    case 'refund.created':
    case 'refund.processed': {
      const paymentId = data.payment_id;
      if (paymentId) {
        await prisma.paymentTransaction.updateMany({
          where: { razorpayPaymentId: paymentId },
          data: { status: 'REFUNDED' },
        });
      }
      break;
    }

    default:
      break;
  }

  return { received: true, event };
}

export default {
  verifyWebhookSignature,
  processWebhookEvent,
};
