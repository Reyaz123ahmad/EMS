import api from './api.js';

export const shiftService = {
  async getMyShift() {
    try {
      const res = await api.get('/shifts/my-shift');
      return res.data?.data || res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const effRes = await api.get('/shifts/effective-shift');
          return effRes.data?.data || effRes.data;
        } catch {
          return { shift: null, message: 'No shift assigned' };
        }
      }
      return { shift: null, message: 'No shift assigned' };
    }
  },

  async getEffectiveShift() {
    try {
      const res = await api.get('/shifts/effective-shift');
      return res.data?.data || res.data;
    } catch {
      return { shift: null, message: 'No shift assigned' };
    }
  },
};

export default shiftService;
