import api from './api.js';

export const documentService = {
  async getDocuments(params = {}) {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  async getMyDocuments(params = {}) {
    const response = await api.get('/documents/my', { params });
    return response.data;
  },

  async getDocument(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async uploadDocument(formData) {
    let payload = formData;
    if (formData instanceof FormData) {
      payload = new FormData();
      for (const [key, value] of formData.entries()) {
        if (key === 'employeeId' && (!value || value === '' || value === 'undefined' || value === 'null')) {
          continue;
        }
        if (value !== '' && value !== null && value !== undefined) {
          payload.append(key, value);
        }
      }
    }
    const response = await api.post('/documents/upload', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data?.data || response.data;
  },

  async verifyDocument(id, data = {}) {
    const response = await api.post(`/documents/${id}/verify`, data);
    return response.data;
  },

  async rejectDocument(id, data = {}) {
    const response = await api.post(`/documents/${id}/reject`, data);
    return response.data;
  },

  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  async downloadDocument(id) {
    const response = await api.get(`/documents/${id}/download`);
    return response.data;
  },

  async getDocumentStats() {
    const response = await api.get('/documents/stats');
    return response.data;
  },

  // ================= Aadhaar Integration Methods =================

  async getAadhaarMode() {
    const response = await api.get('/documents/aadhaar/mode');
    return response.data;
  },

  async sendAadhaarOTP(data) {
    const response = await api.post('/documents/aadhaar/send-otp', data);
    return response.data;
  },

  async verifyAadhaarOTP(data) {
    const response = await api.post('/documents/aadhaar/verify-otp', data);
    return response.data;
  },

  async uploadAadhaar(formData) {
    const response = await api.post('/documents/aadhaar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export default documentService;
