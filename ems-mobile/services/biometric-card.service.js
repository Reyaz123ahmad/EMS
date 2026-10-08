import api, { API_BASE_URL } from './api.js';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { storage } from '../utils/storage.js';
import { Platform } from 'react-native';

export const biometricCardService = {
  // GET /biometric-cards/my
  async getMyCard() {
    const res = await api.get('/biometric-cards/my');
    return res.data?.data || res.data;
  },

  // Download PDF ID card to device and open share/view dialog
  async downloadCard(cardId, cardNumber = 'badge') {
    try {
      const token = await storage.getItem('accessToken');
      const downloadUrl = `${API_BASE_URL}/biometric-cards/${cardId}/download`;

      if (Platform.OS === 'web') {
        window.open(downloadUrl, '_blank');
        return { success: true };
      }

      const fileUri = `${FileSystem.documentDirectory}card_${cardNumber}_${cardId.slice(0, 6)}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Download Identity Badge ${cardNumber}`,
            UTI: 'com.adobe.pdf',
          });
        }
        return { success: true, uri: downloadRes.uri };
      } else {
        throw new Error(`Download failed with HTTP status ${downloadRes.status}`);
      }
    } catch (err) {
      console.error('[BIOMETRIC_CARD] Error downloading card PDF:', err.message);
      throw err;
    }
  },
};

export default biometricCardService;
