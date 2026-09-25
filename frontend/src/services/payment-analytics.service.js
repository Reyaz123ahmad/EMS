import api from './api.js';

export const paymentAnalyticsService = {
  async getRevenueStats(params = {}) {
    const res = await api.get('/payment-analytics/revenue', { params });
    return res.data.data;
  },

  async getMRR(params = {}) {
    const res = await api.get('/payment-analytics/mrr', { params });
    return res.data.data;
  },

  async getARR(params = {}) {
    const res = await api.get('/payment-analytics/arr', { params });
    return res.data.data;
  },

  async getChurnRate(params = {}) {
    const res = await api.get('/payment-analytics/churn', { params });
    return res.data.data;
  },

  async getPaymentSuccessRate(params = {}) {
    const res = await api.get('/payment-analytics/success-rate', { params });
    return res.data.data;
  },

  async getRefundRate(params = {}) {
    const res = await api.get('/payment-analytics/refund-rate', { params });
    return res.data.data;
  },

  async getPaymentMethodStats(params = {}) {
    const res = await api.get('/payment-analytics/payment-methods', { params });
    return res.data.data;
  },

  async getRevenueByPlan(params = {}) {
    const res = await api.get('/payment-analytics/revenue-by-plan', { params });
    return res.data.data;
  }
};

export default paymentAnalyticsService;
