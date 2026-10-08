import api from './api.js';

export const employeeService = {
  /**
   * Update self profile details (phone, emergency contact, etc.)
   */
  async updateMyProfile(data) {
    const response = await api.put('/employees/me/profile', data);
    return response.data;
  },

  /**
   * Upload / Update self profile photo
   */
  async uploadMyPhoto(photoData) {
    let payload = photoData;
    let headers = {};
    if (typeof photoData === 'string') {
      payload = { photo: photoData };
    }
    const response = await api.post('/employees/me/photo', payload, { headers });
    return response.data;
  },

  /**
   * Get self profile photo
   */
  async getMyPhoto() {
    const response = await api.get('/employees/me/photo');
    return response.data;
  },

  /**
   * Delete self profile photo
   */
  async deleteMyPhoto() {
    const response = await api.delete('/employees/me/photo');
    return response.data;
  },
};

export default employeeService;
