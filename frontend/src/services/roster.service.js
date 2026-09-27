import api from './api.js';

export const rosterService = {
  async getRosters(params = {}) {
    const response = await api.get('/rosters', {
      params: {
        page: params.page || 1,
        limit: Math.min(params.limit || 100, 100),
        month: params.month,
        year: params.year,
        employeeId: params.employeeId,
        shiftId: params.shiftId
      }
    });

    const data = response.data?.data || response.data;

    // Ensure array
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.rosters)) return data.rosters;
    if (Array.isArray(response.data?.rosters)) return response.data.rosters;

    return [];
  },

  async generateRoster(data) {
    const payload = {
      shiftId: data.shiftId || undefined,
      month: parseInt(data.month, 10),
      year: parseInt(data.year, 10),
      employeeIds: data.employeeIds || [],
      shiftPattern: data.shiftPattern || data.pattern || '5_2'
    };
    const response = await api.post('/rosters/generate', payload);
    return response.data?.data || response.data;
  },

  async updateRoster(id, data) {
    const response = await api.put(`/rosters/${id}`, data);
    return response.data?.data || response.data;
  },

  async deleteRoster(id) {
    const response = await api.delete(`/rosters/${id}`);
    return response.data?.data || response.data;
  },

  async publishRoster(idOrData) {
    if (typeof idOrData === 'string') {
      const response = await api.post(`/rosters/${idOrData}/publish`);
      return response.data?.data || response.data;
    }
    if (idOrData?.rosterId || idOrData?.id) {
      const id = idOrData.rosterId || idOrData.id;
      const response = await api.post(`/rosters/${id}/publish`, idOrData);
      return response.data?.data || response.data;
    }
    const response = await api.post('/rosters/publish', idOrData);
    return response.data?.data || response.data;
  },

  async getRosterCalendar(params = {}) {
    const response = await api.get('/rosters/calendar', {
      params: {
        month: params.month,
        year: params.year,
        employeeId: params.employeeId
      }
    });
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

export default rosterService;
