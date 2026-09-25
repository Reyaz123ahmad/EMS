import { getProviderConfig, isVerificationEnabled, isDemoMode } from '../config/aadhaar.js';
import logger from '../config/logger.js';

export const aadhaarProviderService = {
  /**
   * Send Aadhaar OTP via configured provider or mock in demo mode
   */
  async sendAadhaarOTP({ aadhaarNumber, name, consent = true }) {
    if (isDemoMode() || !isVerificationEnabled()) {
      const transactionId = 'DEMO_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      logger.info({ transactionId }, '[AadhaarProvider] Demo mode: OTP generation skipped, demo transaction created');
      return {
        transactionId,
        message: 'Demo mode - OTP not required',
        expiresAt,
        provider: 'demo',
        mode: 'DEMO'
      };
    }

    const config = getProviderConfig();
    const cleanNumber = String(aadhaarNumber).replace(/\D/g, '');
    const cleanName = (name || '').trim();

    logger.info({ provider: config.provider, url: config.providerUrl }, '[AadhaarProvider] Calling live provider for Aadhaar OTP');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let endpoint = `${config.providerUrl.replace(/\/$/, '')}/api/v1/aadhaar/otp`;
      let headers = {
        'Content-Type': 'application/json'
      };
      let payload = {};

      if (config.provider === 'setu') {
        headers['x-client-id'] = config.clientId;
        headers['x-client-secret'] = config.apiSecret;
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
        payload = {
          aadhaarNumber: cleanNumber,
          name: cleanName,
          consent: consent === true
        };
      } else if (config.provider === 'signzy') {
        headers['Authorization'] = config.apiKey;
        payload = {
          service: 'aadhaar_otp',
          task: 'generateOTP',
          essentials: {
            aadhaarNumber: cleanNumber
          }
        };
      } else {
        // Default / Karza / generic provider
        headers['x-karza-key'] = config.apiKey;
        payload = {
          aadhaarNo: cleanNumber,
          consent: consent ? 'Y' : 'N'
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error({ status: response.status, resData }, '[AadhaarProvider] Provider OTP generation failed');
        throw new Error(resData.message || resData.error || `Provider error: ${response.statusText}`);
      }

      const transactionId = resData.transactionId || resData.txnId || resData.requestId || resData.id || ('TXN_' + Date.now());
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      return {
        transactionId,
        message: resData.message || 'OTP sent successfully to Aadhaar-linked mobile number',
        expiresAt,
        provider: config.provider,
        mode: 'OTP'
      };
    } catch (err) {
      logger.error({ err: err.message }, '[AadhaarProvider] Failed to send Aadhaar OTP');
      throw err;
    }
  },

  /**
   * Verify Aadhaar OTP via provider or mock in demo mode
   */
  async verifyAadhaarOTP({ transactionId, otp, aadhaarNumber }) {
    if (isDemoMode() || !isVerificationEnabled() || String(transactionId).startsWith('DEMO_')) {
      logger.info({ transactionId }, '[AadhaarProvider] Demo mode OTP verification');
      return {
        verified: true,
        provider: 'demo',
        mode: 'DEMO',
        aadhaarData: {
          name: 'Demo User',
          dob: '1990-01-01',
          gender: 'M',
          address: 'Demo Street, Demo City, 110001',
          photo: null,
          maskedAadhaar: aadhaarNumber ? `XXXX-XXXX-${String(aadhaarNumber).slice(-4)}` : 'XXXX-XXXX-1234'
        }
      };
    }

    const config = getProviderConfig();
    logger.info({ provider: config.provider, transactionId }, '[AadhaarProvider] Calling live provider to verify OTP');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let endpoint = `${config.providerUrl.replace(/\/$/, '')}/api/v1/aadhaar/verify`;
      let headers = {
        'Content-Type': 'application/json'
      };
      let payload = {
        transactionId,
        otp: String(otp).trim(),
        aadhaarNumber: aadhaarNumber ? String(aadhaarNumber).replace(/\D/g, '') : undefined
      };

      if (config.provider === 'setu') {
        headers['x-client-id'] = config.clientId;
        headers['x-client-secret'] = config.apiSecret;
        if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.provider === 'signzy') {
        headers['Authorization'] = config.apiKey;
      } else {
        headers['x-karza-key'] = config.apiKey;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        logger.error({ status: response.status, resData }, '[AadhaarProvider] OTP verification failed at provider');
        return {
          verified: false,
          error: resData.message || resData.error || 'Invalid OTP or verification failed',
          provider: config.provider
        };
      }

      const aadhaarData = resData.data || resData.aadhaarData || {
        name: resData.name,
        dob: resData.dob,
        gender: resData.gender,
        address: resData.address,
        photo: resData.photo
      };

      return {
        verified: true,
        aadhaarData,
        provider: config.provider,
        mode: 'OTP'
      };
    } catch (err) {
      logger.error({ err: err.message }, '[AadhaarProvider] Provider verification request exception');
      throw err;
    }
  },

  /**
   * Check status of transaction
   */
  async getAadhaarStatus({ transactionId }) {
    if (String(transactionId).startsWith('DEMO_') || isDemoMode()) {
      return {
        transactionId,
        status: 'DEMO_VERIFIED',
        mode: 'DEMO'
      };
    }

    const config = getProviderConfig();
    try {
      const response = await fetch(`${config.providerUrl.replace(/\/$/, '')}/api/v1/aadhaar/status/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`
        }
      });
      if (!response.ok) return { transactionId, status: 'UNKNOWN' };
      const data = await response.json();
      return data;
    } catch (err) {
      return { transactionId, status: 'ERROR', message: err.message };
    }
  }
};

export default aadhaarProviderService;
