import api from './api.js';

export const notificationService = {
  // GET /notifications
  async getNotifications(params = {}) {
    const res = await api.get('/notifications', { params });
    return res.data?.data || res.data;
  },

  // GET /notifications/unread-count
  async getUnreadCount() {
    const res = await api.get('/notifications/unread-count');
    const data = res.data?.data ?? res.data;
    return typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
  },

  // PUT /notifications/:id/read
  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data?.data || res.data;
  },

  // PUT /notifications/read-all
  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data?.data || res.data;
  },

  // DELETE /notifications/:id
  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data?.data || res.data;
  },
};

export default notificationService;
