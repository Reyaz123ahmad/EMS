import api from './api.js';

export const subscriptionService = {
  async getCurrentSubscription() {
    const response = await api.get('/subscriptions/current');
    return response.data?.data;
  },

  async getPlans() {
    const response = await api.get('/plans');
    return response.data?.data || response.data || [];
  },

  async createPlan(data) {
    const response = await api.post('/plans', data);
    return response.data?.data || response.data;
  },

  async updatePlan(id, data) {
    const response = await api.put(`/plans/${id}`, data);
    return response.data?.data || response.data;
  },

  async deletePlan(id) {
    const response = await api.delete(`/plans/${id}`);
    return response.data?.data || response.data;
  },

  async createOrder({ planId, billingCycle = 'monthly' }) {
    const response = await api.post('/subscriptions/orders', { planId, billingCycle });
    return response.data?.data;
  },

  async verifyPayment(paymentData) {
    const response = await api.post('/subscriptions/verify', paymentData);
    return response.data;
  },

  async renewSubscription(data) {
    const response = await api.post('/subscriptions/renew', data);
    return response.data;
  },

  async cancelSubscription(reason) {
    const response = await api.post('/subscriptions/cancel', { reason });
    return response.data;
  },

  async getSubscriptionHistory(params = {}) {
    const response = await api.get('/subscriptions/history', { params });
    const data = response.data?.data || response.data;

    // Always return array or normalized object
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.invoices)) return data.invoices;
    if (Array.isArray(data?.payments)) return data.payments;
    if (Array.isArray(data?.history)) return data.history;

    return data || [];
  },

  async getHistory(params = {}) {
    return this.getSubscriptionHistory(params);
  },

  async getSubscriptionStats() {
    const response = await api.get('/subscriptions/stats');
    return response.data?.data || response.data;
  },

  async checkSubscriptionExpiry() {
    const response = await api.get('/subscriptions/check-expiry');
    return response.data?.data || response.data;
  },

  async downloadInvoice(invoiceId) {
    const response = await api.get(`/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default subscriptionService;
