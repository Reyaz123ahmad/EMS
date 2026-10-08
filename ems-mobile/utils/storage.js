import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
  async setItem(key, value) {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      if (isWeb) {
        await AsyncStorage.setItem(key, stringValue);
      } else {
        await SecureStore.setItemAsync(key, stringValue);
      }
    } catch (e) {
      console.warn(`SecureStore setItem failed for ${key}, falling back to AsyncStorage`, e);
      await AsyncStorage.setItem(key, stringValue);
    }
  },

  async getItem(key) {
    try {
      let value = null;
      if (isWeb) {
        value = await AsyncStorage.getItem(key);
      } else {
        value = await SecureStore.getItemAsync(key);
      }
      if (!value) {
        value = await AsyncStorage.getItem(key);
      }
      return value;
    } catch (e) {
      console.warn(`SecureStore getItem failed for ${key}, falling back to AsyncStorage`, e);
      return await AsyncStorage.getItem(key);
    }
  },

  async removeItem(key) {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn(`SecureStore deleteItem failed for ${key}`, e);
    }
    await AsyncStorage.removeItem(key);
  },

  async clear() {
    await this.removeItem('accessToken');
    await this.removeItem('refreshToken');
    await this.removeItem('user');
  }
};

export default storage;
