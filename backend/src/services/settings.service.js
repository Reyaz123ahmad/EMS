export const defaultAttendanceSettings = {
  modes: ['FACE', 'CARD', 'FINGER'],
  geoFencing: {
    enabled: true,
    defaultRadius: 100,
    requireHighAccuracy: true,
    maxAccuracy: 500, // Max 500 meters GPS inaccuracy tolerance
    blockMockLocation: true,
    blockVpn: true
  },
  faceMatch: {
    required: true,
    threshold: 0.75,
    minThreshold: 0.70,
    maxThreshold: 0.95
  },
  liveness: {
    required: true,
    threshold: 0.75
  },
  graceMinutes: 15,
  autoCheckOutAfterHours: 12
};

export default {
  defaultAttendanceSettings
};
