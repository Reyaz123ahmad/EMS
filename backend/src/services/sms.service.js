import env from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Clean and format Indian phone numbers to 10 digits
 * @param {string} phone
 * @returns {string} 10-digit number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }
  if (cleaned.length > 10) {
    return cleaned.slice(-10);
  }
  return cleaned;
}

/**
 * Send OTP SMS via Apihome Gateway
 * @param {string} phone 
 * @param {string|number} otp 
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, remark?: string }>}
 */
export async function sendOtpSms(phone, otp) {
  const cleanPhone = formatPhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    logger.warn({ phone, cleanPhone }, 'Cannot send SMS: Invalid 10-digit phone number');
    return {
      success: false,
      error: 'Invalid phone number format. Must be a 10-digit mobile number.'
    };
  }

  const apiKey = env.APIHOME_KEY || env.SMS_API_KEY || 'a4497dd1a5223272d6a08874b98449c454284';
  const baseUrl = env.APIHOME_BASE_URL || env.SMS_API_URL || 'https://apihome.in/panel/api/bulksms/';
  const senderId = env.APIHOME_SENDER_ID || env.SMS_SENDER_ID || 'SMSIND';
  const templateId = env.APIHOME_OTP_TEMPLATE_ID || '1207161730000000000';
  const message = `Dear Customer Your Login otp is ${otp}`;

  try {
    const params = new URLSearchParams({
      key: apiKey,
      mobile: cleanPhone,
      otp: String(otp),
      sender: senderId,
      template_id: templateId,
      message
    });

    const requestUrl = `${baseUrl.replace(/\/+$/, '')}/?${params.toString()}`;
    console.log('[SMS] Dispatching OTP SMS via Apihome to:', cleanPhone);
    console.log('[SMS] OTP:', otp);
    console.log('[SMS] Request URL:', requestUrl);
    logger.info({ phone: cleanPhone, senderId, baseUrl, requestUrl }, 'Initiating OTP SMS delivery via Apihome');

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { status: response.ok ? 'Success' : 'Failed', remark: responseText };
    }

    const isSuccess = data?.status?.toLowerCase() === 'success' || data?.status === 'Success' || response.ok;

    logger.info(
      { phone: cleanPhone, status: data?.status, requestId: data?.requestId, remark: data?.remark },
      'Apihome SMS response received'
    );

    return {
      success: isSuccess,
      messageId: data?.requestId || `SMS-${Date.now()}`,
      remark: data?.remark || 'Message dispatched',
      data
    };
  } catch (err) {
    logger.error({ err: err.message, phone: cleanPhone }, 'Failed to dispatch SMS via Apihome');
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Send Arbitrary SMS via Apihome Gateway (e.g. Credentials, Notifications)
 * @param {string} phone 
 * @param {string} message 
 * @param {string} [templateId] 
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, remark?: string }>}
 */
export async function sendSms(phone, message, templateId = null) {
  const cleanPhone = formatPhoneNumber(phone);
  if (!cleanPhone || cleanPhone.length !== 10) {
    logger.warn({ phone, cleanPhone }, 'Cannot send SMS: Invalid 10-digit phone number');
    return {
      success: false,
      error: 'Invalid phone number format. Must be a 10-digit mobile number.'
    };
  }

  const apiKey = env.APIHOME_KEY || env.SMS_API_KEY || 'a4497dd1a5223272d6a08874b98449c454284';
  const baseUrl = env.APIHOME_BASE_URL || env.SMS_API_URL || 'https://apihome.in/panel/api/bulksms/';
  const senderId = env.APIHOME_SENDER_ID || env.SMS_SENDER_ID || 'SMSIND';
  const finalTemplateId = templateId || env.APIHOME_CREDENTIALS_TEMPLATE_ID || env.APIHOME_OTP_TEMPLATE_ID || '1207161730000000000';

  try {
    const params = new URLSearchParams({
      key: apiKey,
      mobile: cleanPhone,
      sender: senderId,
      template_id: finalTemplateId,
      message
    });

    const requestUrl = `${baseUrl.replace(/\/+$/, '')}/?${params.toString()}`;
    console.log('[SMS] Dispatching General/Credentials SMS via Apihome to:', cleanPhone);
    console.log('[SMS] Request URL:', requestUrl);
    logger.info({ phone: cleanPhone, senderId, baseUrl, requestUrl }, 'Initiating SMS delivery via Apihome');

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { status: response.ok ? 'Success' : 'Failed', remark: responseText };
    }

    const isSuccess = data?.status?.toLowerCase() === 'success' || data?.status === 'Success' || response.ok;

    logger.info(
      { phone: cleanPhone, status: data?.status, requestId: data?.requestId, remark: data?.remark },
      'Apihome SMS response received'
    );

    return {
      success: isSuccess,
      messageId: data?.requestId || `SMS-${Date.now()}`,
      remark: data?.remark || 'Message dispatched',
      data
    };
  } catch (err) {
    logger.error({ err: err.message, phone: cleanPhone }, 'Failed to dispatch SMS via Apihome');
    return {
      success: false,
      error: err.message
    };
  }
}

export default {
  formatPhoneNumber,
  sendOtpSms,
  sendSms
};
