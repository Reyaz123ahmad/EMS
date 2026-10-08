import { create } from 'zustand';
import api from '../services/api.js';
import storage from '../utils/storage.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  initStatus: 'Starting...',
  error: null,

  // Initialize and check persistent session on app startup
  checkAuth: async () => {
    set({ isLoading: true, initStatus: 'Checking stored session...', error: null });
    try {
      console.log('[AUTH] Checking stored authentication session...');

      // Safety race timeout: 4s max for storage read
      const storagePromise = Promise.all([
        storage.getItem('accessToken'),
        storage.getItem('refreshToken'),
        storage.getItem('user'),
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Storage read timeout')), 4000)
      );

      const [accessToken, refreshToken, storedUserStr] = await Promise.race([
        storagePromise,
        timeoutPromise,
      ]);

      if (!accessToken) {
        console.log('[AUTH] No stored access token found. Navigating to login.');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          initStatus: 'Ready for login',
        });
        return false;
      }

      set({ initStatus: 'Verifying session with backend...' });
      let user = storedUserStr ? JSON.parse(storedUserStr) : null;

      // Validate token with me endpoint with timeout
      try {
        const response = await api.get('/auth/me');
        const freshUser =
          response.data?.user ||
          response.data?.data?.user ||
          response.data?.data ||
          response.data;

        if (freshUser) {
          user = freshUser;
          await storage.setItem('user', user);
        }
      } catch (meErr) {
        console.warn('[AUTH] Could not refresh /auth/me profile (offline/network):', meErr?.message);
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        initStatus: 'Authenticated',
      });
      return true;
    } catch (err) {
      console.warn('[AUTH] Session verification error on startup:', err.message);
      try {
        await storage.clear();
      } catch (clearErr) {
        console.warn('[AUTH] Error clearing storage:', clearErr.message);
      }
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        initStatus: 'Session expired',
      });
      return false;
    } finally {
      // Guarantee that isLoading becomes false so splash never hangs
      set({ isLoading: false });
    }
  },

  // Perform Email + Password Login
  login: async (email, password) => {
    set({ isSubmitting: true, error: null });
    try {
      console.log('[AUTH] Attempting login for:', email.trim());
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const resData = response.data?.data || response.data;
      const accessToken = resData?.accessToken || resData?.token;
      const refreshToken = resData?.refreshToken;
      const user = resData?.user || resData?.employee || resData;

      if (!accessToken) {
        throw new Error('Invalid response from authentication server');
      }

      // Persist credentials
      await storage.setItem('accessToken', accessToken);
      if (refreshToken) {
        await storage.setItem('refreshToken', refreshToken);
      }
      if (user) {
        await storage.setItem('user', user);
      }

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isSubmitting: false,
        isLoading: false,
        error: null,
      });

      return { success: true, user };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login failed. Please check your credentials or network connection.';

      console.error('[AUTH] Login error:', errorMessage);

      set({
        isSubmitting: false,
        error: errorMessage,
      });

      return { success: false, error: errorMessage };
    }
  },

  // Clear Session & Logout
  logout: async () => {
    try {
      const refreshToken = await storage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } catch (e) {
      console.warn('Logout API notification failed', e);
    } finally {
      await storage.clear();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  updateUser: (updatedUser) => {
    const newUser = { ...get().user, ...updatedUser };
    storage.setItem('user', newUser);
    set({ user: newUser });
  },

  forceFinishLoading: () => {
    set({ isLoading: false });
  },
}));

export default useAuthStore;
