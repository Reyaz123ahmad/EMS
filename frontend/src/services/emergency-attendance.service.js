import api from './api.js';

export const emergencyAttendanceService = {
  async getRequests(params = {}) {
    const response = await api.get('/emergency-attendance', { params });
    return response.data?.data || [];
  },

  async getRequestById(id) {
    const response = await api.get(`/emergency-attendance/${id}`);
    return response.data?.data;
  },

  async createRequest(data) {
    const response = await api.post('/emergency-attendance', data);
    return response.data?.data;
  },

  async approveRequest(requestId, notes = '') {
    const response = await api.post(`/emergency-attendance/${requestId}/approve`, { notes });
    return response.data?.data;
  },

  async rejectRequest(requestId, reason) {
    const response = await api.post(`/emergency-attendance/${requestId}/reject`, { reason });
    return response.data?.data;
  },

  async bulkApprove(requestIds) {
    const response = await api.post('/emergency-attendance/bulk-approve', { requestIds });
    return response.data?.data;
  },

  async getEmergencyStats() {
    const response = await api.get('/emergency-attendance/stats');
    return response.data?.data;
  },
};

export default emergencyAttendanceService;
