import api from './api.js';

export const organizationService = {
  // Branches
  async getBranches(params = {}) {
    const response = await api.get('/branches', { params });
    return response.data;
  },

  async getBranch(id) {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  },

  async createBranch(data) {
    const response = await api.post('/branches', data);
    return response.data;
  },

  async updateBranch(id, data) {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
  },

  async deleteBranch(id) {
    const response = await api.delete(`/branches/${id}`);
    return response.data;
  },

  async bulkImportBranches(data) {
    const response = await api.post('/branches/bulk-import', data);
    return response.data;
  },

  async exportBranches(params = {}) {
    const response = await api.get('/branches/export', { params });
    return response.data;
  },

  // Departments
  async getDepartments(params = {}) {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  async getDepartment(id) {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async createDepartment(data) {
    const response = await api.post('/departments', data);
    return response.data;
  },

  async updateDepartment(id, data) {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id) {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  async bulkImportDepartments(data) {
    const response = await api.post('/departments/bulk-import', data);
    return response.data;
  },

  async exportDepartments(params = {}) {
    const response = await api.get('/departments/export', { params });
    return response.data;
  },

  // Designations
  async getDesignations(params = {}) {
    const response = await api.get('/designations', { params });
    return response.data;
  },

  async getDesignation(id) {
    const response = await api.get(`/designations/${id}`);
    return response.data;
  },

  async createDesignation(data) {
    const response = await api.post('/designations', data);
    return response.data;
  },

  async updateDesignation(id, data) {
    const response = await api.put(`/designations/${id}`, data);
    return response.data;
  },

  async deleteDesignation(id) {
    const response = await api.delete(`/designations/${id}`);
    return response.data;
  },

  async bulkImportDesignations(data) {
    const response = await api.post('/designations/bulk-import', data);
    return response.data;
  },

  async exportDesignations(params = {}) {
    const response = await api.get('/designations/export', { params });
    return response.data;
  }
};

export default organizationService;
