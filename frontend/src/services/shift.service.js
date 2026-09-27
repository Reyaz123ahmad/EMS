import api from './api.js';

export const shiftService = {
  async getShifts() {
    const response = await api.get('/shifts');
    const data = response.data?.data || response.data;
    
    // Always return array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.shifts)) return data.shifts;
    if (Array.isArray(response.data?.shifts)) return response.data.shifts;
    if (Array.isArray(data?.data)) return data.data;
    
    console.log('getShifts raw data:', data);
    return [];
  },

  async getShift(id) {
    const response = await api.get(`/shifts/${id}`);
    return response.data?.data || response.data?.shift || response.data;
  },

  async createShift(data) {
    const response = await api.post('/shifts', data);
    return response.data?.data || response.data;
  },

  async updateShift(id, data) {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteShift(id) {
    const response = await api.delete(`/shifts/${id}`);
    return response.data?.data || response.data;
  },

  async assignShift(data) {
    const response = await api.post('/shifts/assign', data);
    return response.data?.data || response.data;
  },

  async getShiftStats() {
    const response = await api.get('/shifts/stats');
    return response.data?.data || response.data?.stats || response.data;
  },

  async getMyShift() {
    const response = await api.get('/shifts/my-shift');
    return response.data?.data || response.data;
  },

  // Rosters
  async getRosters(params = {}) {
    const response = await api.get('/rosters', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rosters)) return data.rosters;
    if (Array.isArray(response.data?.rosters)) return response.data.rosters;
    return [];
  },

  async generateRoster(data) {
    const response = await api.post('/rosters/generate', data);
    return response.data?.data || response.data;
  },

  async publishRoster(data) {
    const response = await api.post('/rosters/publish', data);
    return response.data?.data || response.data;
  },

  async getRosterCalendar(params = {}) {
    const response = await api.get('/rosters/calendar', { params });
    const data = response.data?.data || response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.roster)) return data.roster;
    if (Array.isArray(data?.rosters)) return data.rosters;
    return data || [];
  },

  async bulkAssignRoster(data) {
    const response = await api.post('/rosters/bulk-assign', data);
    return response.data?.data || response.data;
  }
};

export default shiftService;
