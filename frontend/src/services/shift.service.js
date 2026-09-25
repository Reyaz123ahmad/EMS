import api from './api.js';

export const shiftService = {
  async getShifts() {
    const response = await api.get('/shifts');
    return response.data;
  },

  async getShift(id) {
    const response = await api.get(`/shifts/${id}`);
    return response.data;
  },

  async createShift(data) {
    const response = await api.post('/shifts', data);
    return response.data;
  },

  async updateShift(id, data) {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data;
  },

  async deleteShift(id) {
    const response = await api.delete(`/shifts/${id}`);
    return response.data;
  },

  async assignShift(data) {
    const response = await api.post('/shifts/assign', data);
    return response.data;
  },

  async getShiftStats() {
    const response = await api.get('/shifts/stats');
    return response.data;
  },

  // Rosters
  async getRosters(params = {}) {
    const response = await api.get('/rosters', { params });
    return response.data;
  },

  async generateRoster(data) {
    const response = await api.post('/rosters/generate', data);
    return response.data;
  },

  async publishRoster(data) {
    const response = await api.post('/rosters/publish', data);
    return response.data;
  },

  async getRosterCalendar(params = {}) {
    const response = await api.get('/rosters/calendar', { params });
    return response.data;
  },

  async bulkAssignRoster(data) {
    const response = await api.post('/rosters/bulk-assign', data);
    return response.data;
  }
};

export default shiftService;
