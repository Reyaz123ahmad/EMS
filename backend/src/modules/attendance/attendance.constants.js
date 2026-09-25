export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  HALF_DAY: 'HALF_DAY',
  LATE: 'LATE',
  ON_LEAVE: 'ON_LEAVE',
  HOLIDAY: 'HOLIDAY',
  WEEKLY_OFF: 'WEEKLY_OFF'
};

export const ATTENDANCE_METHODS = {
  FACE: 'FACE',
  CARD: 'CARD',
  FINGER: 'FINGER',
  MANUAL: 'MANUAL',
  EMERGENCY: 'EMERGENCY'
};

export const OPERATIONS = {
  CHECK_IN: 'CHECK_IN',
  CHECK_OUT: 'CHECK_OUT',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END'
};

export const REQUIRED_LAYERS = {
  LIVENESS: 'LIVENESS',
  FACE_MATCH: 'FACE_MATCH',
  GEO: 'GEO',
  DEVICE: 'DEVICE',
  TIME: 'TIME'
};

export const DEFAULT_GEOFENCE_RADIUS = 100; // in meters
export const MAX_GPS_ACCURACY = 50; // max allowable GPS inaccuracy in meters

export const DEFAULT_SHIFT_RULES = {
  workHoursPerDay: 8,
  minWorkMinutesFullDay: 420, // 7 hours
  minWorkMinutesHalfDay: 240, // 4 hours
  gracePeriodMinutes: 15,
  maxDailyBreaks: 3,
  maxBreakMinutesTotal: 60
};

export default {
  ATTENDANCE_STATUS,
  ATTENDANCE_METHODS,
  OPERATIONS,
  REQUIRED_LAYERS,
  DEFAULT_GEOFENCE_RADIUS,
  MAX_GPS_ACCURACY,
  DEFAULT_SHIFT_RULES
};
