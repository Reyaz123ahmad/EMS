import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import api from './api.js';

export const buildDeviceInfo = (isMockLocation = false) => ({
  platform: Platform.OS, // 'ios' | 'android'
  appVersion:
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    '1.0.0',
  deviceModel: Device.modelName || (Platform.OS === 'ios' ? 'iPhone' : 'Android Device'),
  osVersion: Device.osVersion ? `${Device.osVersion}` : `${Platform.Version}`,
  isMockLocation: Boolean(isMockLocation),
  isSimulator: !Device.isDevice,
});

export const attendanceService = {
  // GET /attendance/today
  async getTodayStatus() {
    const res = await api.get('/attendance/today');
    return res.data?.data || res.data;
  },

  // POST /attendance/check-in
  async checkIn({ mode, photo = null, location, remarks = '', cardNumber = null } = {}) {
    if (!location) {
      throw new Error('Location is required for check-in');
    }

    const payload = {
      mode: mode || 'face',
      photo: photo || undefined,
      cardNumber: cardNumber || undefined,
      location: {
        lat: location.lat ?? location.latitude,
        lng: location.lng ?? location.longitude,
        accuracy: location.accuracy,
        source: location.source || 'gps',
      },
      deviceInfo: buildDeviceInfo(location.isMockLocation || location.isMock || location.mocked),
      remarks: remarks || undefined,
    };

    const res = await api.post('/attendance/check-in', payload);
    return res.data?.data || res.data;
  },

  // POST /attendance/check-out
  async checkOut({ mode, photo = null, location, remarks = '', cardNumber = null } = {}) {
    if (!location) {
      throw new Error('Location is required for check-out');
    }

    const payload = {
      mode: mode || 'face',
      photo: photo || undefined,
      cardNumber: cardNumber || undefined,
      location: {
        lat: location.lat ?? location.latitude,
        lng: location.lng ?? location.longitude,
        accuracy: location.accuracy,
        source: location.source || 'gps',
      },
      deviceInfo: buildDeviceInfo(location.isMockLocation || location.isMock || location.mocked),
      remarks: remarks || undefined,
    };

    const res = await api.post('/attendance/check-out', payload);
    return res.data?.data || res.data;
  },

  // POST /attendance/break-start
  async startBreak({ breakType = 'SHORT', mode, photo = null, location = null, remarks = '' } = {}) {
    const payload = {
      breakType,
      mode: mode || 'face',
      photo: photo || undefined,
      location: location
        ? {
            lat: location.lat ?? location.latitude,
            lng: location.lng ?? location.longitude,
            accuracy: location.accuracy,
            source: location.source || 'gps',
          }
        : undefined,
      deviceInfo: buildDeviceInfo(location?.isMockLocation || location?.isMock || location?.mocked),
      remarks: remarks || undefined,
    };
    const res = await api.post('/attendance/break-start', payload);
    return res.data?.data || res.data;
  },

  // POST /attendance/break-end
  async endBreak({ mode, photo = null, location = null, remarks = '' } = {}) {
    const payload = {
      mode: mode || 'face',
      photo: photo || undefined,
      location: location
        ? {
            lat: location.lat ?? location.latitude,
            lng: location.lng ?? location.longitude,
            accuracy: location.accuracy,
            source: location.source || 'gps',
          }
        : undefined,
      deviceInfo: buildDeviceInfo(location?.isMockLocation || location?.isMock || location?.mocked),
      remarks: remarks || undefined,
    };
    const res = await api.post('/attendance/break-end', payload);
    return res.data?.data || res.data;
  },

  // GET /attendance/break-status
  async getBreakStatus() {
    try {
      const res = await api.get('/attendance/break-status');
      return res.data?.data || res.data;
    } catch {
      return null;
    }
  },

  // GET /attendance/checkout-status
  async getCheckoutStatus(params = {}) {
    try {
      const res = await api.get('/attendance/checkout-status', { params });
      return res.data?.data || res.data;
    } catch {
      return null;
    }
  },

  // GET /attendance/logs
  async getLogs({ page = 1, limit = 20, startDate, endDate, status } = {}) {
    const params = { page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (status) params.status = status;

    const res = await api.get('/attendance/logs', { params });
    return res.data?.data || res.data;
  },

  // GET /attendance/calendar
  async getCalendar({ month, year } = {}) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get('/attendance/calendar', { params });
    return res.data?.data || res.data;
  },

  // GET /attendance/employee-summary
  async getSummary({ month, year } = {}) {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await api.get('/attendance/employee-summary', { params });
    return res.data?.data || res.data;
  },
};

export default attendanceService;
