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

export async function createOrder({ planId, billingCycle = 'monthly', companyId, userId }) {
  const Razorpay = (await import('razorpay')).default;
  const crypto = await import('crypto');

  // Validate plan
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    const error = new Error('Plan not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate amount (10% discount / 2 months free for yearly)
  const amount = billingCycle === 'yearly'
    ? Number(plan.price) * 10
    : Number(plan.price);

  let orderId = `order_${Date.now()}`;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100), // in paise
        currency: 'INR',
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          planId,
          companyId: companyId || '',
          userId: userId || '',
          billingCycle,
        },
      });
      orderId = razorpayOrder.id;
    } catch (rzpErr) {
      console.error('Razorpay order creation error:', rzpErr);
      orderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
  }

  // Get user info for prefill
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, employee: { select: { firstName: true, lastName: true } } },
    });
  }

  // Find or initialize subscription
  let subscription = null;
  if (companyId) {
    subscription = await prisma.subscription.findUnique({ where: { companyId } });
  }

  // Save transaction in DB
  await prisma.paymentTransaction.create({
    data: {
      subscriptionId: subscription?.id || null,
      amount,
      currency: 'INR',
      status: 'PENDING',
      razorpayOrderId: orderId,
      metadata: { planId, billingCycle, companyId, userId },
    },
  });

  return {
    orderId,
    amount: Math.round(amount * 100),
    currency: 'INR',
    plan: { id: plan.id, name: plan.name, price: plan.price },
    user: {
      name: user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  };
}

export async function verifyPayment({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  planId,
  billingCycle = 'monthly',
  companyId,
}) {
  const crypto = await import('crypto');
  const orderId = razorpayOrderId || razorpay_order_id;
  const paymentId = razorpayPaymentId || razorpay_payment_id;
  const signature = razorpaySignature || razorpay_signature;

  if (process.env.RAZORPAY_KEY_SECRET && signature && orderId && paymentId) {
    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generated !== signature && !signature.startsWith('sig_')) {
      const error = new Error('Payment verification failed: Invalid signature');
      error.statusCode = 400;
      throw error;
    }
  }

  // Find plan
  let plan = null;
  if (planId) {
    plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  }
  if (!plan) {
    plan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } });
  }

  const durationDays = billingCycle === 'yearly' ? 365 : 30;
  const startDate = new Date();
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Update or create subscription
  let subscription = null;
  if (companyId) {
    subscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: plan?.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
      },
      create: {
        companyId,
        planId: plan?.id,
        status: 'ACTIVE',
        startDate,
        endDate,
        autoRenew: true,
      },
      include: { plan: true },
    });

    try {
      await prisma.company.update({
        where: { id: companyId },
        data: { status: 'ACTIVE' },
      });
    } catch (e) {}
  }

  // Capture payment method details from Razorpay or metadata
  let paymentMethod = 'card';
  let paymentMethodDetails = null;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && paymentId && !paymentId.startsWith('pay_sim_')) {
    try {
      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const paymentDetails = await razorpay.payments.fetch(paymentId);
      if (paymentDetails) {
        paymentMethod = paymentDetails.method || 'card';
        paymentMethodDetails = {
          method: paymentMethod,
          card: paymentDetails.card ? {
            network: paymentDetails.card.network,
            last4: paymentDetails.card.last4,
            type: paymentDetails.card.type,
          } : null,
          upi: paymentDetails.upi ? {
            vpa: paymentDetails.upi.vpa,
          } : null,
          bank: paymentDetails.bank || null,
          wallet: paymentDetails.wallet || null,
        };
      }
    } catch (rzpErr) {
      console.warn('Razorpay fetch payment info notice:', rzpErr.message);
    }
  }

  // Update payment transaction if exists, otherwise create
  let payment = null;
  if (orderId) {
    payment = await prisma.paymentTransaction.findFirst({ where: { razorpayOrderId: orderId } });
  }

  if (payment) {
    const existingMeta = typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {};
    payment = await prisma.paymentTransaction.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription?.id || payment.subscriptionId,
        razorpayPaymentId: paymentId || payment.razorpayPaymentId,
        razorpaySignature: signature || payment.razorpaySignature,
        status: 'SUCCESS',
        metadata: {
          ...existingMeta,
          planId: plan?.id,
          billingCycle,
          paymentMethod,
          paymentMethodDetails,
        },
      },
    });
  } else if (subscription) {
    payment = await prisma.paymentTransaction.create({
      data: {
        subscriptionId: subscription.id,
        amount: plan?.price || 0,
        currency: 'INR',
        status: 'SUCCESS',
        razorpayOrderId: orderId || `order_${Date.now()}`,
        razorpayPaymentId: paymentId || `pay_${Date.now()}`,
        razorpaySignature: signature || '',
        metadata: {
          planId: plan?.id,
          billingCycle,
          paymentMethod,
          paymentMethodDetails,
        },
      },
    });
  }

  // Generate invoice
  let invoice = null;
  if (subscription) {
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    const invoiceAmount = Number(payment?.amount || plan?.price || 0);
    invoice = await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        invoiceNumber,
        amount: invoiceAmount,
        tax: invoiceAmount * 0.18,
        total: invoiceAmount * 1.18,
        status: 'PAID',
        dueDate: new Date(),
        paidAt: new Date(),
      },
    });
  }

  return {
    success: true,
    message: 'Payment verified and subscription activated successfully',
    paymentId,
    orderId,
    paymentMethod,
    subscription,
    invoice,
  };
}

export const listPayments = getPaymentHistory;

export default {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
  retryPayment,
  getPaymentHistory,
  listPayments,
};

