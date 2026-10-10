import api from './api.js';

export const leaveService = {
  // GET /leave/types
  async getLeaveTypes() {
    const res = await api.get('/leave/types');
    return res.data?.data || res.data;
  },

  // GET /leave/balances
  async getLeaveBalances(year) {
    const params = {};
    if (year) params.year = year;
    const res = await api.get('/leave/balances', { params });
    return res.data?.data || res.data;
  },

  // GET /leave/calendar
  async getCalendar({ month, year } = {}) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get('/leave/calendar', { params });
    return res.data?.data || res.data;
  },

  // GET /leave/requests/my
  async getMyRequests({ page = 1, limit = 20, status } = {}) {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/leave/requests/my', { params });
    return res.data?.data || res.data;
  },

  // POST /leave/apply
  async applyLeave({
    leaveTypeId,
    startDate,
    endDate,
    reason,
    isHalfDay = false,
    halfDayType = 'FIRST_HALF',
  }) {
    const payload = {
      leaveTypeId,
      startDate,
      endDate,
      reason,
      isHalfDay,
      halfDayType: isHalfDay ? halfDayType : undefined,
    };
    const res = await api.post('/leave/apply', payload);
    return res.data?.data || res.data;
  },

  // GET /leave/history
  async getLeaveHistory({ page = 1, limit = 20 } = {}) {
    const res = await api.get('/leave/history', { params: { page, limit } });
    return res.data?.data || res.data;
  },

  // POST /leave/requests/:id/cancel
  async cancelLeave(id, reason = '') {
    const res = await api.post(`/leave/requests/${id}/cancel`, { reason });
    return res.data?.data || res.data;
  },
};

export default leaveService;
