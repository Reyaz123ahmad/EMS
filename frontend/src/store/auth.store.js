import { create } from 'zustand';

const storedUser = localStorage.getItem('user');
const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: !!storedAccessToken,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
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
    localStorage.setItem('user', JSON.stringify(user));
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
  }
}));

export default useAuthStore;
