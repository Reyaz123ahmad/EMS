import api from './api.js';

export const planService = {
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
  }
};

export default planService;
