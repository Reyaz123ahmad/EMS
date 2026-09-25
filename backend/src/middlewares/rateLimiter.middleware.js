import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

export const otpRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 200, // max 200 in dev/test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many OTP requests. Please wait 10 minutes before requesting again.'
  }
});

export default {
  authRateLimit,
  otpRateLimit
};
