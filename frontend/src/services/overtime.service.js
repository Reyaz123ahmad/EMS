import api from './api.js';

export const overtimeService = {
  async getOvertimeRules() {
    const response = await api.get('/overtime/rules');
    const data = response.data?.data || response.data;
    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rules)) return data.rules;
    if (Array.isArray(response.data?.rules)) return response.data.rules;
    
    return [];
  },

  async getRules() {
    return this.getOvertimeRules();
  },

  async createOvertimeRule(payload) {
    const response = await api.post('/overtime/rules', payload);
    return response.data?.data || response.data;
  },

  async createRule(data) {
    return this.createOvertimeRule(data);
  },

  async updateOvertimeRule(id, data) {
    const response = await api.put(`/overtime/rules/${id}`, data);
    return response.data?.data || response.data;
  },

  async updateRule(id, data) {
    return this.updateOvertimeRule(id, data);
  },

  async deleteOvertimeRule(id) {
    const response = await api.delete(`/overtime/rules/${id}`);
    return response.data?.data || response.data;
  },

  async deleteRule(id) {
    return this.deleteOvertimeRule(id);
  },

  async listOvertimeRecords(params = {}) {
    const response = await api.get('/overtime/records', { params });
    const data = response.data?.data || response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(response.data?.records)) return response.data.records;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  },

  async getRecords(params = {}) {
    return this.listOvertimeRecords(params);
  },

  async calculate(data) {
    const response = await api.post('/overtime/calculate', data);
    return response.data?.data || response.data;
  },

  async applyOvertime(payload) {
    const cleanPayload = {
      date: payload.date,
      requestedMinutes: parseInt(payload.requestedMinutes || payload.minutes, 10),
      reason: payload.reason || null
    };

    console.log('Sending overtime request:', cleanPayload);

    const response = await api.post('/overtime/apply', cleanPayload);
    return response.data?.data || response.data;
  },

  async apply(data) {
    return this.applyOvertime(data);
  },

  async getRequests(params = {}) {
    const response = await api.get('/overtime/requests', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.requests)) return data.requests;
    if (Array.isArray(response.data?.requests)) return response.data.requests;
    return [];
  },

  async approveOvertime(id) {
    const response = await api.post(`/overtime/requests/${id}/approve`);
    return response.data?.data || response.data;
  },

  async approveRequest(id) {
    return this.approveOvertime(id);
  },

  async rejectOvertime(id, reason) {
    const response = await api.post(`/overtime/requests/${id}/reject`, {
      reason: reason || 'Rejected by manager'
    });
    return response.data?.data || response.data;
  },

  async rejectRequest(id, reason) {
    return this.rejectOvertime(id, reason);
  },

  async bulkApprove(data) {
    const response = await api.post('/overtime/requests/bulk-approve', data);
    return response.data?.data || response.data;
  },

  async getOvertimeStats(params = {}) {
    const response = await api.get('/overtime/stats', { params });
    const data = response.data?.data || response.data?.stats || response.data;
    return data || {
      totalHours: 0,
      approvedHours: 0,
      totalApprovedHours: 0,
      estimatedCost: 0,
      totalCost: 0,
      pendingCount: 0
    };
  },

  async getStats(params = {}) {
    return this.getOvertimeStats(params);
  },

  async getReport(params = {}) {
    const response = await api.get('/overtime/report', { params });
    return response.data?.data || response.data;
  }
};

export default overtimeService;
