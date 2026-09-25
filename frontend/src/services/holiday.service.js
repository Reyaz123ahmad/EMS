import api from './api.js';

export const holidayService = {
  async getHolidayCalendars() {
    const response = await api.get('/holiday-calendars/calendars');
    return response.data;
  },

  async createHolidayCalendar(data) {
    const response = await api.post('/holiday-calendars/calendars', data);
    return response.data;
  },

  async updateHolidayCalendar(id, data) {
    const response = await api.put(`/holiday-calendars/calendars/${id}`, data);
    return response.data;
  },

  async deleteHolidayCalendar(id) {
    const response = await api.delete(`/holiday-calendars/calendars/${id}`);
    return response.data;
  },

  async getHolidays(params = {}) {
    const response = await api.get('/holiday-calendars/holidays', { params });
    return response.data;
  },

  async getCalendarView(params = {}) {
    const response = await api.get('/holiday-calendars/calendar-view', { params });
    return response.data;
  },

  async createHoliday(data) {
    const response = await api.post('/holiday-calendars/holidays', data);
    return response.data;
  },

  async updateHoliday(id, data) {
    const response = await api.put(`/holiday-calendars/holidays/${id}`, data);
    return response.data;
  },

  async deleteHoliday(id) {
    const response = await api.delete(`/holiday-calendars/holidays/${id}`);
    return response.data;
  },

  async bulkImportHolidays(data) {
    const response = await api.post('/holiday-calendars/bulk-import', data);
    return response.data;
  },

  async assignHolidays(data) {
    const response = await api.post('/holiday-calendars/assign', data);
    return response.data;
  }
};

export default holidayService;
