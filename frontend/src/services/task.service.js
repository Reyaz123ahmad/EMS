import api from './api.js';

export const taskService = {
  async getTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data?.data || response.data;
  },

  async getTaskDetail(id) {
    const response = await api.get(`/tasks/${id}`);
    return response.data?.data || response.data;
  },

  async updateTaskProgress(id, data) {
    const response = await api.put(`/tasks/${id}/progress`, data);
    return response.data?.data || response.data;
  },

  async addTaskComment(id, data) {
    const response = await api.post(`/tasks/${id}/comments`, data);
    return response.data?.data || response.data;
  }
};

export default taskService;
