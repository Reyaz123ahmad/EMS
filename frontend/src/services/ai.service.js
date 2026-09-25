import api from './api';

export const aiService = {
  // 1. Interactive AI Assistant Chat
  chat: async ({ message, sessionId, context }) => {
    const response = await api.post('/ai/chat', { message, sessionId, context });
    return response.data?.data || response.data;
  },

  // 2. Free Tier Quota & Usage Statistics
  getUsageStats: async () => {
    const response = await api.get('/ai/usage-stats');
    return response.data?.data || response.data;
  },

  // 3. Saved Insights History
  getSavedInsights: async (params = {}) => {
    const response = await api.get('/ai/insights', { params });
    return response.data?.data || response.data;
  },

  // 4. Employee Performance AI
  getEmployeePerformance: async (employeeId, period = 'current') => {
    const response = await api.get(`/ai/employees/${employeeId}/performance`, {
      params: { period }
    });
    return response.data?.data || response.data;
  },

  // 5. Employee Improvement Plan
  getEmployeeImprovementPlan: async (employeeId) => {
    const response = await api.get(`/ai/employees/${employeeId}/improvement-plan`);
    return response.data?.data || response.data;
  },

  // 6. Attrition Prediction
  getAttritionPrediction: async (employeeId) => {
    const response = await api.get(`/ai/employees/${employeeId}/attrition`);
    return response.data?.data || response.data;
  },

  // 7. Attendance Forecast Prediction
  getAttendancePrediction: async (month = 'next_month') => {
    const response = await api.get('/ai/attendance/prediction', {
      params: { month }
    });
    return response.data?.data || response.data;
  },

  // 8. Company Analytics AI
  getCompanyAnalytics: async (period = 'current_month') => {
    const response = await api.get('/ai/analytics/company', {
      params: { period }
    });
    return response.data?.data || response.data;
  },

  // 9. Platform Analytics AI (Super Admin)
  getPlatformAnalytics: async (period = 'monthly') => {
    const response = await api.get('/ai/analytics/platform', {
      params: { period }
    });
    return response.data?.data || response.data;
  },

  // 10. Anomaly Detection
  getAnomalyDetection: async (dataType = 'ATTENDANCE_AND_PAYROLL') => {
    const response = await api.get('/ai/anomalies', {
      params: { dataType }
    });
    return response.data?.data || response.data;
  },

  // 11. Business Recommendations
  getBusinessRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data?.data || response.data;
  }
};

export default aiService;
