import api from './api.js';

export const advancedSecurityService = {
  async attestDevice(data) {
    const response = await api.post('/security/attest', data);
    return response.data?.data;
  },

  async validateIP(data) {
    const response = await api.post('/security/validate-ip', data);
    return response.data?.data;
  },

  async detectVPN(data) {
    const response = await api.post('/security/detect-vpn', data);
    return response.data?.data;
  },

  async getSecurityScore(params = {}) {
    const response = await api.get('/security/security-score', { params });
    return response.data?.data;
  },

  async updateSecuritySettings(data) {
    const response = await api.put('/security/security-settings', data);
    return response.data?.data;
  },

  async getSecurityDashboard() {
    const response = await api.get('/security/dashboard');
    return response.data?.data;
  },

  async getFraudSignals(params = {}) {
    const response = await api.get('/security/fraud-signals', { params });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.signals)) return data.signals;
    return [];
  },

  async reviewFraudSignal(signalId, data) {
    const response = await api.post(`/security/fraud-signals/${signalId}/review`, data);
    return response.data?.data;
  },

  async getSecurityEvents(params = {}) {
    const response = await api.get('/security/events', { params });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.events)) return data.events;
    return [];
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/security/audit-logs', { params });
    const data = response.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.logs)) return data.logs;
    return [];
  },

  async exportAuditLogs(params = {}) {
    const response = await api.get('/security/audit-logs/export', { params });
    return response.data?.data || [];
  },

  async getBlockedEmployees() {
    const response = await api.get('/security/blocked-employees');
    return response.data?.data || [];
  },

  async blockEmployee(data) {
    const response = await api.post('/security/block-employee', data);
    return response.data?.data;
  },

  async unblockEmployee(data) {
    const response = await api.post('/security/unblock-employee', data);
    return response.data?.data;
  },
};

export default advancedSecurityService;
