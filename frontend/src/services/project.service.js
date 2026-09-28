import api from './api.js';

export const projectService = {
  async getProjects(params = {}) {
    const response = await api.get('/projects', { params });
    return response.data?.data || response.data;
  },

  async createProject(data) {
    const response = await api.post('/projects', data);
    return response.data?.data || response.data;
  },

  async getProjectDetail(id) {
    const response = await api.get(`/projects/${id}`);
    return response.data?.data || response.data;
  },

  async getMyProjects() {
    const response = await api.get('/projects/my');
    return response.data?.data || response.data;
  },

  async getMyProjectDetail(id) {
    const response = await api.get(`/projects/my/${id}`);
    return response.data?.data || response.data;
  },

  async assignManager(projectId, managerId) {
    const response = await api.patch(`/projects/${projectId}/manager`, { managerId });
    return response.data?.data || response.data;
  },

  async getMembers(projectId) {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data?.data || response.data;
  },

  async addMember(projectId, data) {
    const response = await api.post(`/projects/${projectId}/members`, data);
    return response.data?.data || response.data;
  },

  async removeMember(projectId, memberId) {
    const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
    return response.data?.data || response.data;
  },

  async getMemberProgress(projectId) {
    const response = await api.get(`/projects/${projectId}/members/progress`);
    return response.data?.data || response.data;
  },

  async getProjectTasks(projectId, params = {}) {
    const endpoint = projectId && projectId !== 'all' ? `/projects/${projectId}/tasks` : '/tasks';
    const response = await api.get(endpoint, { params });
    return response.data?.data || response.data;
  },

  async createProjectTask(projectId, data) {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data?.data || response.data;
  },

  async getAllTasks(params = {}) {
    const response = await api.get('/tasks', { params });
    return response.data?.data || response.data;
  }
};

export default projectService;
