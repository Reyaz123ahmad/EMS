import api from './api.js';

export const leaveService = {
  async getLeaveTypes() {
    const response = await api.get('/leave/types');
    const data = response.data?.data || response.data;

    // Return array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.types)) return data.types;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  },

  async createLeaveType(payload) {
    const response = await api.post('/leave/types', payload);
    return response.data?.data || response.data;
  },

  async updateLeaveType(id, payload) {
    // Clean payload
    const cleanPayload = {};
    const allowed = ['name', 'code', 'description', 'maxDaysPerYear', 'daysAllowed', 'isPaid', 'carryForward', 'maxCarryForward', 'maxCarryForwardDays', 'isActive'];

    for (const key of allowed) {
      if (payload[key] !== undefined && payload[key] !== null) {
        cleanPayload[key] = payload[key];
      }
    }

    const response = await api.put(`/leave/types/${id}`, cleanPayload);
    return response.data?.data || response.data;
  },

  async deleteLeaveType(id) {
    const response = await api.delete(`/leave/types/${id}`);
    return response.data?.data || response.data;
  },

  async getBalances(params = {}) {
    const response = await api.get('/leave/balances', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.balances)) return data.balances;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async getMyBalances(params = {}) {
    const response = await api.get('/leave/balances', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.balances)) return data.balances;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async getEmployeeBalances(employeeId, params = {}) {
    const response = await api.get(`/leave/balances/${employeeId}`, { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.balances)) return data.balances;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  async applyLeave(data) {
    const response = await api.post('/leave/apply', data);
    return response.data;
  },

  async getMyRequests(params = {}) {
    const response = await api.get('/leave/requests/my', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.requests)) return data.requests;
    if (Array.isArray(data?.data)) return data.data;
    return [];
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

  async cancelLeave(id, reason = '') {
    const response = await api.post(`/leave/requests/${id}/cancel`, { reason });
    return response.data?.data || response.data;
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
    return response.data?.data || response.data;
  },

  async getBalanceReport(params = {}) {
    const response = await api.get('/leave/balance-report', { params });
    return response.data?.data || response.data;
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

  async getLeaveHistory(params = {}) {
    const response = await api.get('/leave/history', { params });
    const data = response.data?.data || response.data;
    
    // Ensure array is returned
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.leaves)) return data.leaves;
    if (Array.isArray(data?.history)) return data.history;
    if (Array.isArray(data?.data)) return data.data;
    
    return [];
  },

  async getEmployeeHistory(employeeId, params = {}) {
    const response = await api.get(`/leave/history/${employeeId}`, { params });
    const data = response.data?.data || response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.leaves)) return data.leaves;
    if (Array.isArray(data?.history)) return data.history;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  }
};

export default leaveService;
