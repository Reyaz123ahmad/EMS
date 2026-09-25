import api from './api.js';

export const settingsService = {
  async getSettings(companyId, type) {
    const response = await api.get(`/companies/${companyId}/settings/${type}`);
    return response.data?.data;
  },

  async updateSettings(companyId, type, data) {
    const response = await api.put(`/companies/${companyId}/settings/${type}`, data);
    return response.data?.data;
  },

  async resetSettings(companyId, settingType) {
    const response = await api.post(`/companies/${companyId}/settings/reset`, { settingType });
    return response.data?.data;
  },

  async getSettingsSchema() {
    const response = await api.get('/companies/settings/schema');
    return response.data?.data;
  },
};

export default settingsService;
