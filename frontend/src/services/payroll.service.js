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

  async getMySlips(params = {}) {
    const response = await api.get('/payroll/slips/my', { params });
    const data = response.data?.data || response.data;
    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.slips)) return data.slips;
    if (Array.isArray(response.data?.slips)) return response.data.slips;
    
    return [];
  },

  async getAllSlips(params = {}) {
    const response = await api.get('/payroll/slips', { params });
    const data = response.data?.data || response.data;
    
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.slips)) return data.slips;
    if (Array.isArray(response.data?.slips)) return response.data.slips;
    
    return [];
  },

  async getSalarySlips(params = {}) {
    const response = await api.get('/payroll/slips', { params });
    const data = response.data?.data || response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.slips)) return data.slips;
    if (Array.isArray(response.data?.slips)) return response.data.slips;

    return [];
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
  },

  async listSalaryStructures(params = {}) {
    const response = await api.get('/payroll/salary-structures', { params });
    return response.data?.data || response.data;
  },

  async listReimbursements(params = {}) {
    const response = await api.get('/payroll/reimbursements', { params });
    const data = response.data?.data || response.data;
    if (data && Array.isArray(data.reimbursements)) return data;
    if (Array.isArray(data)) return { reimbursements: data, total: data.length };
    return { reimbursements: [], total: 0 };
  },

  async listLoansAdvances(params = {}) {
    const response = await api.get('/payroll/loans-advances', { params });
    const data = response.data?.data || response.data;
    if (data && Array.isArray(data.loans)) return data;
    if (Array.isArray(data)) return { loans: data, total: data.length };
    return { loans: [], total: 0 };
  },

  async listTaxSlabs(params = {}) {
    const response = await api.get('/payroll/tax-slabs', { params });
    const data = response.data?.data || response.data;
    return data || {};
  },

  async getPayrollConfig() {
    const response = await api.get('/companies/payroll-config');
    return response.data?.data || response.data;
  },

  async updatePayrollConfig(data) {
    const response = await api.put('/companies/payroll-config', data);
    return response.data?.data || response.data;
  },

  async listStructureTemplates() {
    const response = await api.get('/payroll/salary-structures/templates');
    return response.data?.data?.templates || response.data?.templates || response.data?.data || [];
  },

  async createStructureTemplate(data) {
    const response = await api.post('/payroll/salary-structures', data);
    return response.data?.data || response.data;
  },

  async assignEmployeeStructure(employeeId, data) {
    const response = await api.put(`/payroll/employee/${employeeId}/structure`, data);
    return response.data?.data || response.data;
  },

  async getPayrollAnalytics(params = {}) {
    const response = await api.get('/payroll/analytics', { params });
    return response.data?.data || response.data;
  }
};

export default payrollService;
