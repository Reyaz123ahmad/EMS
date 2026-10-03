import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  PORT: process.env.PORT || '5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '20h',
  JWT_REFRESH_EXPIRES_IN_DAYS: process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '30',
  JWT_ISSUER: process.env.JWT_ISSUER || 'mindstocs_ems',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'mindstocs_ems-api',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
  REDIS_URL: process.env.REDIS_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  AADHAAR_PROVIDER_URL: process.env.AADHAAR_PROVIDER_URL,
  AADHAAR_API_KEY: process.env.AADHAAR_API_KEY,
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'apihome',
  SMS_API_URL: process.env.SMS_API_URL || 'https://apihome.in/panel/api/bulksms/',
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_SENDER_ID: process.env.SMS_SENDER_ID || 'SMSIND',
  APIHOME_KEY: process.env.APIHOME_KEY || process.env.SMS_API_KEY || 'a4497dd1a5223272d6a08874b98449c454284',
  APIHOME_BASE_URL: process.env.APIHOME_BASE_URL || process.env.SMS_API_URL || 'https://apihome.in/panel/api/bulksms/',
  APIHOME_SENDER_ID: process.env.APIHOME_SENDER_ID || process.env.SMS_SENDER_ID || 'SMSIND',
  APIHOME_OTP_TEMPLATE_ID: process.env.APIHOME_OTP_TEMPLATE_ID || '1207161730000000000',
  PUSH_PROVIDER: process.env.PUSH_PROVIDER,
  PUSH_API_URL: process.env.PUSH_API_URL,
  PUSH_API_KEY: process.env.PUSH_API_KEY,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET
};

export default env;
