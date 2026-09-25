import api from './api.js';

export const documentService = {
  async getDocuments(params = {}) {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  async getDocument(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async uploadDocument(formData) {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
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
