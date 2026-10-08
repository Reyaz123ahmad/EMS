import api, { API_BASE_URL } from './api.js';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { storage } from '../utils/storage.js';
import { Platform } from 'react-native';

export const payrollService = {
  // GET /payroll/slips/my
  async getMyPayslips({ page = 1, limit = 20, year } = {}) {
    const params = { page, limit };
    if (year) params.year = year;
    const res = await api.get('/payroll/slips/my', { params });
    return res.data?.data || res.data;
  },

  // Download PDF payslip to phone and open share sheet
  async downloadPayslip(id, slipName = 'Payslip') {
    try {
      const token = await storage.getItem('accessToken');
      const downloadUrl = `${API_BASE_URL}/payroll/slips/${id}/download`;

      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
        return { success: true };
      }

      const fileUri = `${FileSystem.documentDirectory}${slipName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${id.slice(0, 6)}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Download ${slipName}`,
            UTI: 'com.adobe.pdf',
          });
        }
        return { success: true, uri: downloadRes.uri };
      } else {
        throw new Error(`Download failed with HTTP status ${downloadRes.status}`);
      }
    } catch (err) {
      console.error('[PAYROLL] Error downloading payslip PDF:', err.message);
      throw err;
    }
  },
};

export default payrollService;
