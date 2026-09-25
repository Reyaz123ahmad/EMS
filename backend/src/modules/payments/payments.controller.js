import * as paymentsService from './payments.service.js';
import * as webhookService from './webhook.service.js';

export async function handleFailure(req, res, next) {
  try {
    const { paymentId, reason } = req.body;
    const payment = await paymentsService.handlePaymentFailure({ paymentId, reason });
    res.status(200).json({
      success: true,
      message: 'Payment failure handled and recorded',
      data: payment,
    });
  } catch (err) {
    next(err);
  }
}

export async function retryPayment(req, res, next) {
  try {
    const { paymentId } = req.body;
    const result = await paymentsService.retryPayment({ paymentId });
    res.status(200).json({
      success: true,
      message: 'Payment retry initiated',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId || req.user?.companyId : req.user?.companyId || req.user?.company?.id;
    const { page, limit } = req.query;

    const history = await paymentsService.getPaymentHistory(companyId, { page, limit });
    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    const isValid = webhookService.verifyWebhookSignature(payload, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = payload.event || 'payment.captured';
    const result = await webhookService.processWebhookEvent(event, payload);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  handleFailure,
  retryPayment,
  getHistory,
  handleWebhook,
};
