import api from './api.js';

export const paymentService = {
  async getRazorpayConfig() {
    const response = await api.get('/payments/razorpay-config');
    return response.data?.data || response.data;
  },

  async createOrder(planId, billingCycle = 'monthly') {
    const payload = typeof planId === 'object' ? planId : { planId, billingCycle };
    const response = await api.post('/payments/create-order', payload);
    return response.data?.data || response.data;
  },

  async verifyPayment(data) {
    const response = await api.post('/payments/verify', data);
    return response.data?.data || response.data;
  },

  async getHistory(params = {}) {
    const response = await api.get('/payments/history', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.payments)) return data.payments;
    if (Array.isArray(data?.history)) return data.history;
    return data || [];
  },

  async retryPayment(paymentId) {
    const response = await api.post('/payments/retry', { paymentId });
    return response.data?.data || response.data;
  },

  async reportFailure(data) {
    const response = await api.post('/payments/failure', data);
    return response.data?.data || response.data;
  }
};

export default paymentService;
