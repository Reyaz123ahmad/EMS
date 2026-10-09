import api from './api.js';

export const performanceService = {
  async getCycles(params = {}) {
    const response = await api.get('/performance/cycles', { params });
    return response.data?.data || response.data;
  },

  async createCycle(data) {
    const response = await api.post('/performance/cycles', data);
    return response.data?.data || response.data;
  },

  async getReviews(params = {}) {
    const response = await api.get('/performance/reviews', { params });
    return response.data?.data || response.data;
  },

  async createReview(data) {
    const response = await api.post('/performance/reviews', data);
    return response.data?.data || response.data;
  },

  async getTeamPerformance(params = {}) {
    const response = await api.get('/performance/team', { params });
    return response.data?.data || response.data;
  }
};

export default performanceService;
