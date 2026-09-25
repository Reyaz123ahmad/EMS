import api from './api.js';

export const couponService = {
  async listCoupons(params = {}) {
    const res = await api.get('/coupons', { params });
    return res.data.data;
  },

  async createCoupon(data) {
    const res = await api.post('/coupons', data);
    return res.data.data;
  },

  async updateCoupon(id, data) {
    const res = await api.put(`/coupons/${id}`, data);
    return res.data.data;
  },

  async deleteCoupon(id) {
    const res = await api.delete(`/coupons/${id}`);
    return res.data.data;
  },

  async validateCoupon(data) {
    const res = await api.post('/coupons/validate', data);
    return res.data.data;
  },

  async applyCoupon(data) {
    const res = await api.post('/coupons/apply', data);
    return res.data.data;
  },

  async getCouponStats(params = {}) {
    const res = await api.get('/coupons/stats', { params });
    return res.data.data;
  }
};

export default couponService;
