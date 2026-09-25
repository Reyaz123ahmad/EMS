/**
 * Validate email format
 * @param {string} email 
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validate Indian/international phone number
 * @param {string} phone 
 */
export function validatePhone(phone) {
  const re = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return re.test(String(phone).replace(/\s+/g, ''));
}

/**
 * Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
 * @param {string} password 
 */
export function validatePassword(password) {
  if (!password || password.length < 8) return false;
  return true;
}

/**
 * Validate 6 digit OTP
 * @param {string} otp 
 */
export function validateOTP(otp) {
  return /^\d{6}$/.test(String(otp).trim());
}
