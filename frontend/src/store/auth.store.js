import { create } from 'zustand';
import authService from '../services/auth.service.js';

const storedUser = localStorage.getItem('user');
const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');

// Guard against literal "undefined" or null
const isValidToken = storedAccessToken && storedAccessToken !== 'undefined' && storedAccessToken !== 'null';

export const useAuthStore = create((set) => ({
  user: storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null,
  accessToken: isValidToken ? storedAccessToken : null,
  refreshToken: storedRefreshToken && storedRefreshToken !== 'undefined' ? storedRefreshToken : null,
  isAuthenticated: !!isValidToken,

  setAuth: (user, accessToken, refreshToken) => {
    if (!accessToken || accessToken === 'undefined') {
      console.error('[auth.store] setAuth called without valid accessToken', { user, accessToken });
      return;
    }

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken && refreshToken !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({
      user,
      accessToken,
      refreshToken: refreshToken || null,
      isAuthenticated: true
    });
  },

  updateUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error in auth store:', e);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      });
    }
  }
}));

export default useAuthStore;
