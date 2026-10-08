import axios from 'axios';
import { storage } from '../utils/storage.js';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://ems-rmb2.onrender.com/api/v1';

console.log('[API] Base URL configured:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15-second timeout to handle high-latency or slow mobile networks
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token & Log Request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    } catch (error) {
      console.warn('[API REQUEST] Error reading token from storage:', error.message);
    }
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error.message);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 Auto-Refresh & Error Logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status || 'NETWORK_ERROR';
    console.error(`[API ERROR] ${status} on ${originalRequest?.url || 'unknown'}:`, error.message);

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/login') &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        }, { timeout: 15000 });

        const newAccessToken = res.data?.accessToken || res.data?.data?.accessToken;
        const newRefreshToken = res.data?.refreshToken || res.data?.data?.refreshToken;

        if (newAccessToken) {
          await storage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            await storage.setItem('refreshToken', newRefreshToken);
          }
          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          throw new Error('No new access token received');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.clear();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Retry policy for transient network errors on GET requests (max 2 retries with exponential backoff)
    if (
      (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) &&
      originalRequest &&
      originalRequest.method?.toLowerCase() === 'get' &&
      (originalRequest._retryCount || 0) < 2
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delayMs = originalRequest._retryCount * 1000;
      console.log(`[API RETRY] Retrying ${originalRequest.url} (attempt ${originalRequest._retryCount}/2) after ${delayMs}ms...`);
      await new Promise((res) => setTimeout(res, delayMs));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
