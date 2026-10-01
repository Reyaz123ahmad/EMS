import { computeExtraBreakMinutes, computeExpectedCheckout } from '../src/modules/attendance/attendance.service.js';

const shiftDay = { startTime: '09:00', endTime: '18:00', graceMinutes: 15 };
const shiftNight = { startTime: '21:00', endTime: '06:00', graceMinutes: 15 };

function fmt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

console.log('=== TEST 1: Before check-in ===');
console.log({ expectedCheckout: null, uiText: 'Not checked in yet' });

console.log('=== TEST 2: On-time check-in, no breaks ===');
const t2 = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks: [] });
console.log({ expected: fmt(t2.expectedCheckout), delay: t2.totalDelayMinutes });

console.log('=== TEST 3: On-time check-in, break within quota ===');
const t3 = computeExpectedCheckout({
  shift: shiftDay,
  lateMinutes: 0,
  breaks: [
    { breakType: 'SHORT', durationMinutes: 20 },
    { breakType: 'LUNCH', durationMinutes: 25 }
  ]
});
console.log({ expected: fmt(t3.expectedCheckout), delay: t3.totalDelayMinutes });

console.log('=== TEST 4: Lunch exceeded ===');
const t4 = computeExpectedCheckout({
  shift: shiftDay,
  lateMinutes: 0,
  breaks: [
    { breakType: 'SHORT', durationMinutes: 10 },
    { breakType: 'LUNCH', durationMinutes: 45 }
  ]
});
console.log({ expected: fmt(t4.expectedCheckout), delay: `+${t4.totalDelayMinutes} min`, late: t4.lateMinutes, extraBreak: t4.extraBreakMinutes });

console.log('=== TEST 5: Late + lunch exceeded ===');
const t5 = computeExpectedCheckout({
  shift: shiftDay,
  lateMinutes: 60,
  breaks: [
    { breakType: 'LUNCH', durationMinutes: 45 }
  ]
});
console.log({ expected: fmt(t5.expectedCheckout), delay: `+${t5.totalDelayMinutes} min`, late: t5.lateMinutes, extraBreak: t5.extraBreakMinutes });

console.log('=== TEST 6: Short exceeded, lunch within ===');
const t6 = computeExpectedCheckout({
  shift: shiftDay,
  lateMinutes: 0,
  breaks: [
    { breakType: 'SHORT', durationMinutes: 45 },
    { breakType: 'LUNCH', durationMinutes: 20 }
  ]
});
console.log({ expected: fmt(t6.expectedCheckout), delay: `+${t6.totalDelayMinutes} min`, late: t6.lateMinutes, extraBreak: t6.extraBreakMinutes });

console.log('=== TEST 7: Both exceeded ===');
const t7 = computeExpectedCheckout({
  shift: shiftDay,
  lateMinutes: 0,
  breaks: [
    { breakType: 'SHORT', durationMinutes: 45 },
    { breakType: 'LUNCH', durationMinutes: 45 }
  ]
});
console.log({ expected: fmt(t7.expectedCheckout), delay: `+${t7.totalDelayMinutes} min`, late: t7.lateMinutes, extraBreak: t7.extraBreakMinutes });

console.log('=== TEST 8: Night roster shift ===');
const t8 = computeExpectedCheckout({
  shift: shiftNight,
  lateMinutes: 60,
  breaks: [
    { breakType: 'LUNCH', durationMinutes: 45 }
  ]
});
console.log({ expected: fmt(t8.expectedCheckout), delay: `+${t8.totalDelayMinutes} min`, late: t8.lateMinutes, extraBreak: t8.extraBreakMinutes });
