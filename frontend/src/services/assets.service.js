import api from './api.js';

export const assetsService = {
  async getAssets(params = {}) {
    const response = await api.get('/assets', { params });
    return response.data?.data || [];
  },

  async getAssetById(id) {
    const response = await api.get(`/assets/${id}`);
    return response.data?.data;
  },

  async createAsset(data) {
    const response = await api.post('/assets', data);
    return response.data?.data;
  },

  async updateAsset(id, data) {
    const response = await api.put(`/assets/${id}`, data);
    return response.data?.data;
  },

  async deleteAsset(id) {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  },

  async assignAsset(assetId, data) {
    const response = await api.post(`/assets/${assetId}/assign`, data);
    return response.data?.data;
  },

  async returnAsset(assetId, data) {
    const response = await api.post(`/assets/${assetId}/return`, data);
    return response.data?.data;
  },

  async getAssetHistory(assetId) {
    const response = await api.get(`/assets/${assetId}/history`);
    return response.data?.data || [];
  },

  async getEmployeeAssets(employeeId) {
    const response = await api.get(`/assets/employee/${employeeId}`);
    return response.data?.data || [];
  },

  async getAssetStats() {
    const response = await api.get('/assets/stats');
    return response.data?.data;
  },

  async bulkImportAssets(data) {
    const response = await api.post('/assets/bulk-import', data);
    return response.data?.data;
  },

  async exportAssets(params = {}) {
    const response = await api.get('/assets/export', { params });
    return response.data?.data || [];
  },

  async getAssetCategories() {
    const response = await api.get('/assets/categories');
    return response.data?.data || [];
  },

  async createAssetCategory(data) {
    const response = await api.post('/assets/categories', data);
    return response.data?.data;
  },
};

export default assetsService;
