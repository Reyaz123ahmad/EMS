import api from './api.js';

export const payrollService = {
  async getSalaryComponents() {
    const response = await api.get('/payroll/components');
    return response.data;
  },

  async createSalaryComponent(data) {
    const response = await api.post('/payroll/components', data);
    return response.data;
  },

  async updateSalaryComponent(id, data) {
    const response = await api.put(`/payroll/components/${id}`, data);
    return response.data;
  },

  async deleteSalaryComponent(id) {
    const response = await api.delete(`/payroll/components/${id}`);
    return response.data;
  },

  async getEmployeeSalaryStructure(employeeId) {
    const response = await api.get(`/payroll/structure/${employeeId}`);
    return response.data;
  },

  async updateEmployeeSalaryStructure(employeeId, data) {
    const response = await api.put(`/payroll/structure/${employeeId}`, data);
    return response.data;
  },

  async bulkUpdateSalaryStructure(data) {
    const response = await api.post('/payroll/structure/bulk-update', data);
    return response.data;
  },

  async previewPayroll(data) {
    const response = await api.post('/payroll/preview', data);
    return response.data;
  },

  async processPayroll(data) {
    const response = await api.post('/payroll/process', data);
    return response.data;
  },

  async approvePayroll(id) {
    const response = await api.post(`/payroll/runs/${id}/approve`);
    return response.data;
  },

  async getPayrollRuns(params = {}) {
    const response = await api.get('/payroll/runs', { params });
    return response.data;
  },

  async getPayrollRunDetail(id) {
    const response = await api.get(`/payroll/runs/${id}`);
    return response.data;
  },

  async getSalarySlips(params = {}) {
    const response = await api.get('/payroll/slips', { params });
    return response.data;
  },

  async getStats(params = {}) {
    const response = await api.get('/payroll/stats', { params });
    return response.data;
  },

  async generateSalarySlipsPDF(id) {
    const response = await api.post(`/payroll/runs/${id}/generate-slips`);
    return response.data;
  },

  async sendSalarySlips(id) {
    const response = await api.post(`/payroll/runs/${id}/send-slips`);
    return response.data;
  }
};

export default payrollService;
