import dotenv from 'dotenv';
dotenv.config();

const verificationEnabledEnv = process.env.AADHAAR_VERIFICATION_ENABLED;
const aadhaarProvider = (process.env.AADHAAR_PROVIDER || 'setu').toLowerCase();
const aadhaarProviderUrl = process.env.AADHAAR_PROVIDER_URL || 'https://api.setu.co/aadhaar';
const aadhaarApiKey = process.env.AADHAAR_API_KEY || '';
const aadhaarApiSecret = process.env.AADHAAR_API_SECRET || '';
const aadhaarClientId = process.env.AADHAAR_CLIENT_ID || '';
const uidaiSandboxUrl = process.env.UIDAI_SANDBOX_URL || 'https://sandbox.uidai.gov.in';
const uidaiSandboxApiKey = process.env.UIDAI_SANDBOX_API_KEY || '';

export const isVerificationEnabled = () => {
  return verificationEnabledEnv === 'true' || process.env.AADHAAR_VERIFICATION_ENABLED === 'true';
};

export const isDemoMode = () => {
  return !isVerificationEnabled();
};

export const getProviderConfig = () => {
  return {
    provider: aadhaarProvider,
    providerUrl: aadhaarProviderUrl,
    apiKey: aadhaarApiKey,
    apiSecret: aadhaarApiSecret,
    clientId: aadhaarClientId,
    sandboxUrl: uidaiSandboxUrl,
    sandboxApiKey: uidaiSandboxApiKey,
    enabled: isVerificationEnabled(),
    mode: isVerificationEnabled() ? 'OTP' : 'DEMO'
  };
};

export const isProviderConfigured = () => {
  if (isDemoMode()) return true;
  return Boolean(aadhaarProviderUrl && (aadhaarApiKey || aadhaarClientId));
};

export const aadhaarConfig = {
  isVerificationEnabled,
  isDemoMode,
  aadhaarProvider,
  getProviderConfig,
  isProviderConfigured
};

export default aadhaarConfig;
