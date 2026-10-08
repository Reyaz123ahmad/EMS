import api from './api.js';

export const dashboardService = {
  // GET /dashboard/employee
  async getEmployeeDashboard() {
    const res = await api.get('/dashboard/employee');
    return res.data?.data || res.data;
  },
};

export default dashboardService;
