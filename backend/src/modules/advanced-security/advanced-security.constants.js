export const ATTESTATION_PROVIDERS = {
  PLAY_INTEGRITY: 'PLAY_INTEGRITY',
  APP_ATTEST: 'APP_ATTEST',
  SAFETY_NET: 'SAFETY_NET'
};

export const SECURITY_LEVELS = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  HIGH: 'HIGH',
  PARANOID: 'PARANOID'
};

export const DEFAULT_SECURITY_SETTINGS = {
  securityLevel: SECURITY_LEVELS.STANDARD,
  ipWhitelistEnabled: false,
  allowedIpRanges: ['127.0.0.1', '192.168.1.0/24', '10.0.0.0/8'],
  requireDeviceAttestation: false,
  blockRootedDevices: true,
  blockEmulators: true,
  blockVpn: true,
  maxFailedAttempts: 5,
  fraudThresholdScore: 60
};

export default {
  ATTESTATION_PROVIDERS,
  SECURITY_LEVELS,
  DEFAULT_SECURITY_SETTINGS
};
