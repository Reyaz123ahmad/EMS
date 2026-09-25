import api from './api.js';

export const subscriptionService = {
  async getCurrentSubscription() {
    const response = await api.get('/subscriptions/current');
    return response.data?.data;
  },

  async getPlans() {
    const response = await api.get('/subscriptions/plans');
    return response.data?.data || [];
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

  async getSubscriptionHistory() {
    const response = await api.get('/subscriptions/history');
    return response.data?.data || [];
  },

  async getSubscriptionStats() {
    const response = await api.get('/subscriptions/stats');
    return response.data?.data;
  },

  async checkSubscriptionExpiry() {
    const response = await api.get('/subscriptions/check-expiry');
    return response.data?.data;
  },
};

export default subscriptionService;
