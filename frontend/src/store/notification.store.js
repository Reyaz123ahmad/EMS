import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  },

  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  fetchNotifications: async (filters = {}, pagination = { page: 1, limit: 20 }) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications', {
        params: { ...filters, ...pagination }
      });
      const data = response.data?.data;
      if (data) {
        set({
          notifications: data.notifications || [],
          pagination: data.pagination || get().pagination,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      const count = response.data?.data?.unreadCount || 0;
      set({ unreadCount: count });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set((state) => {
        const deleted = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: deleted && !deleted.isRead ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }
}));

export default useNotificationStore;
