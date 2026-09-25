import api from './api.js';

export const leaveService = {
  async getLeaveTypes() {
    const response = await api.get('/leave/types');
    return response.data;
  },

  async createLeaveType(data) {
    const response = await api.post('/leave/types', data);
    return response.data;
  },

  async updateLeaveType(id, data) {
    const response = await api.put(`/leave/types/${id}`, data);
    return response.data;
  },

  async deleteLeaveType(id) {
    const response = await api.delete(`/leave/types/${id}`);
    return response.data;
  },

  async getBalances(params = {}) {
    const response = await api.get('/leave/balances', { params });
    return response.data;
  },

  async getEmployeeBalances(employeeId, params = {}) {
    const response = await api.get(`/leave/balances/${employeeId}`, { params });
    return response.data;
  },

  async applyLeave(data) {
    const response = await api.post('/leave/apply', data);
    return response.data;
  },

  async getLeaveRequests(params = {}) {
    const response = await api.get('/leave/requests', { params });
    return response.data;
  },

  async approveLeave(id) {
    const response = await api.post(`/leave/requests/${id}/approve`);
    return response.data;
  },

  async rejectLeave(id, data = {}) {
    const response = await api.post(`/leave/requests/${id}/reject`, data);
    return response.data;
  },

  async bulkApproveLeave(data) {
    const response = await api.post('/leave/requests/bulk-approve', data);
    return response.data;
  },

  async getLeaveCalendar(params = {}) {
    const response = await api.get('/leave/calendar', { params });
    return response.data;
  },

  async getLeaveBalanceReport(params = {}) {
    const response = await api.get('/leave/balance-report', { params });
    return response.data;
  },

  async bulkAllocateLeaves(data) {
    const response = await api.post('/leave/bulk-allocate', data);
    return response.data;
  },

  async carryForwardLeaves(data) {
    const response = await api.post('/leave/carry-forward', data);
    return response.data;
  },

  async getStats(params = {}) {
    const response = await api.get('/leave/stats', { params });
    return response.data;
  },

  async getEmployeeHistory(employeeId, params = {}) {
    const response = await api.get(`/leave/history/${employeeId}`, { params });
    return response.data;
  }
};

export default leaveService;
