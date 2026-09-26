import prisma from '../../config/prisma.js';

export async function handlePaymentFailure({ paymentId, reason }) {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  });

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      status: 'FAILED',
      metadata: {
        ...(payment.metadata || {}),
        failureReason: reason,
        failedAt: new Date(),
      },
    },
  });

  // Set subscription to PAST_DUE if auto-renew failed
  if (payment.subscriptionId) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: 'PAST_DUE' },
    });
  }

  return updated;
}

export async function retryPayment({ paymentId }) {
  const payment = await prisma.paymentTransaction.findUnique({
    where: { id: paymentId },
    include: { subscription: { include: { plan: true } } },
  });

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  // Generate retry order ID
  const retryOrderId = `order_retry_${Date.now()}`;

  const updated = await prisma.paymentTransaction.update({
    where: { id: paymentId },
    data: {
      razorpayOrderId: retryOrderId,
      status: 'PENDING',
    },
  });

  return {
    payment: updated,
    retryOrderId,
    amount: payment.amount,
  };
}

export async function getPaymentHistory(companyId, pagination = { page: 1, limit: 20 }) {
  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  if (!companyId) {
    const [total, payments] = await Promise.all([
      prisma.paymentTransaction.count(),
      prisma.paymentTransaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              company: true,
              plan: true,
            },
          },
          refundRequests: true,
        },
      }),
    ]);

    return { total, page, limit, totalPages: Math.ceil(total / limit) || 1, payments };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!subscription) {
    return { total: 0, page, limit, totalPages: 0, payments: [] };
  }

  const [total, payments] = await Promise.all([
    prisma.paymentTransaction.count({ where: { subscriptionId: subscription.id } }),
    prisma.paymentTransaction.findMany({
      where: { subscriptionId: subscription.id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            company: true,
            plan: true,
          },
        },
        refundRequests: true,
      },
    }),
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit) || 1, payments };
}

export const listPayments = getPaymentHistory;

export default {
  handlePaymentFailure,
  retryPayment,
  getPaymentHistory,
  listPayments
};
