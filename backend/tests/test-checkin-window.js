import { getCheckInWindow, getShiftWindow, computeExpectedCheckout } from '../src/modules/attendance/attendance.service.js';

const shiftDay = { startTime: '09:00', endTime: '18:00', graceMinutes: 15 };
const shiftNight = { startTime: '21:00', endTime: '06:00', graceMinutes: 15 };

function createTime(hours, minutes) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

console.log('====================================================');
console.log('CHECK-IN WINDOW VERIFICATION SUITE (ALL 10 TESTS)');
console.log('====================================================\n');

// TEST 1 — At 08:50 (10 min before shift)
const t1 = getCheckInWindow({ shift: shiftDay, now: createTime(8, 50) });
console.log('TEST 1 (08:50):', {
  canCheckIn: t1.canCheckIn,
  windowStatus: t1.windowStatus,
  minutesUntilStart: t1.minutesUntilStart,
  reason: t1.checkInBlockReason
});

// TEST 2 — At 08:55 (5 min before shift)
const t2 = getCheckInWindow({ shift: shiftDay, now: createTime(8, 55) });
console.log('TEST 2 (08:55):', {
  canCheckIn: t2.canCheckIn,
  windowStatus: t2.windowStatus,
  minutesLeftInGrace: t2.minutesLeftInGrace
});

// TEST 3 — At 09:00 (on time)
const t3 = getCheckInWindow({ shift: shiftDay, now: createTime(9, 0) });
console.log('TEST 3 (09:00):', {
  canCheckIn: t3.canCheckIn,
  windowStatus: t3.windowStatus,
  minutesLeftInGrace: t3.minutesLeftInGrace
});

// TEST 4 — At 09:10 (within grace)
const t4 = getCheckInWindow({ shift: shiftDay, now: createTime(9, 10) });
console.log('TEST 4 (09:10):', {
  canCheckIn: t4.canCheckIn,
  windowStatus: t4.windowStatus,
  minutesLeftInGrace: t4.minutesLeftInGrace
});

// TEST 5 — At 09:20 (grace passed)
const t5 = getCheckInWindow({ shift: shiftDay, now: createTime(9, 20) });
console.log('TEST 5 (09:20):', {
  canCheckIn: t5.canCheckIn,
  windowStatus: t5.windowStatus,
  reason: t5.checkInBlockReason
});

// TEST 6 — At 18:30 (after shift end)
const t6 = getCheckInWindow({ shift: shiftDay, now: createTime(18, 30) });
console.log('TEST 6 (18:30):', {
  canCheckIn: t6.canCheckIn,
  windowStatus: t6.windowStatus,
  reason: t6.checkInBlockReason
});

// TEST 7 — RFID card at 08:50 (before shift)
const t7Now = createTime(8, 50);
const t7Win = getCheckInWindow({ shift: shiftDay, now: t7Now });
const t7Blocked = t7Now.getTime() < t7Win.fiveMinBefore.getTime();
console.log('TEST 7 (RFID at 08:50):', {
  blocked: t7Blocked,
  error: t7Blocked ? `Your shift starts at ${shiftDay.startTime}. Cannot check in yet.` : null
});

// TEST 8 — RFID card at 09:20 (grace passed)
const t8Now = createTime(9, 20);
const t8Win = getCheckInWindow({ shift: shiftDay, now: t8Now });
const t8Blocked = t8Now.getTime() > t8Win.graceCutoff.getTime();
console.log('TEST 8 (RFID at 09:20):', {
  blocked: t8Blocked,
  error: t8Blocked ? `Check-in time has passed. Grace period ended at ${t8Win.graceCutoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. You will be marked ABSENT.` : null
});

// TEST 9 — Face at 08:55 (within 5 min window)
const t9Now = createTime(8, 55);
const t9Win = getCheckInWindow({ shift: shiftDay, now: t9Now });
const t9Allowed = t9Now.getTime() >= t9Win.fiveMinBefore.getTime() && t9Now.getTime() <= t9Win.graceCutoff.getTime();
const t9LateMinutes = 0;
console.log('TEST 9 (Face at 08:55):', {
  allowed: t9Allowed,
  lateMinutes: t9LateMinutes
});

// TEST 10 — Night roster shift (21:00–06:00)
const t10_1 = getCheckInWindow({ shift: shiftNight, now: createTime(20, 50) });
const t10_2 = getCheckInWindow({ shift: shiftNight, now: createTime(20, 55) });
const t10_3 = getCheckInWindow({ shift: shiftNight, now: createTime(21, 20) });
console.log('TEST 10 (Night shift 21:00-06:00):', {
  at20_50: { canCheckIn: t10_1.canCheckIn, status: t10_1.windowStatus, minsUntilStart: t10_1.minutesUntilStart },
  at20_55: { canCheckIn: t10_2.canCheckIn, status: t10_2.windowStatus, minsLeftInGrace: t10_2.minutesLeftInGrace },
  at21_20: { canCheckIn: t10_3.canCheckIn, status: t10_3.windowStatus, reason: t10_3.checkInBlockReason }
});
