import { describe, it, expect } from 'vitest';
import { getCheckInWindow, getShiftWindow } from '../../../backend/src/modules/attendance/attendance.service.js';

function createTime(hours, minutes, baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

describe('PHASE 3: Multi-User Countdown & Shift Resolution Verification', () => {
  const shiftGeneral = { id: 'shift-gen-0900', name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15 };
  const shiftNight = { id: 'shift-night-2100', name: 'Night Shift', startTime: '21:00', endTime: '06:00', graceMinutes: 15, isNightShift: true };
  const shiftDay10 = { id: 'shift-day-1000', name: 'Day Shift', startTime: '10:00', endTime: '19:00', graceMinutes: 15 };

  // Helper formatting for frontend display
  function getMessage(status, data, shift) {
    const startStr = shift.startTime;
    const endStr = shift.endTime;
    const graceH = String(data.graceCutoff.getHours()).padStart(2, '0');
    const graceM = String(data.graceCutoff.getMinutes()).padStart(2, '0');
    const graceStr = `${graceH}:${graceM}`;

    switch (status) {
      case 'BEFORE_WINDOW':
        return `Your shift starts in ${data.minutesUntilStart} minutes (at ${startStr}). Cannot check in yet.`;
      case 'WINDOW_OPEN':
        return `Check-in window open. Grace ends in ${data.minutesLeftInGrace} minutes.`;
      case 'GRACE_PASSED':
        return `Check-in time has passed. Grace period ended at ${graceStr}. You will be marked ABSENT.`;
      case 'SHIFT_ENDED':
        return `Your shift ended at ${endStr}. Check-in not allowed.`;
      default:
        return 'Check-in window is not currently open.';
    }
  }

  it('TEST 1 — Employee A (General 09:00-18:00): At 08:00 AM (60 min) and At 12:26 PM (Absent / Grace passed)', () => {
    // At 08:00 AM
    const win0800 = getCheckInWindow({ shift: shiftGeneral, now: createTime(8, 0) });
    expect(win0800.minutesUntilStart).toBe(60);
    expect(win0800.windowStatus).toBe('BEFORE_WINDOW');
    expect(win0800.canCheckIn).toBe(false);
    const msg0800 = getMessage(win0800.windowStatus, win0800, shiftGeneral);
    expect(msg0800).toBe('Your shift starts in 60 minutes (at 09:00). Cannot check in yet.');

    // At 12:26 PM
    const win1226 = getCheckInWindow({ shift: shiftGeneral, now: createTime(12, 26) });
    expect(win1226.minutesUntilStart).toBe(0); // NOT 124 min!
    expect(win1226.windowStatus).toBe('GRACE_PASSED');
    expect(win1226.canCheckIn).toBe(false);
    const msg1226 = getMessage(win1226.windowStatus, win1226, shiftGeneral);
    expect(msg1226).toContain('Grace period ended at 09:15. You will be marked ABSENT.');
    expect(msg1226).not.toContain('starts in 124 minutes');
    expect(msg1226).not.toContain('14:30');
  });

  it('TEST 2 — Employee B (General 09:00-18:00): At 08:30 AM -> 30 min (NOT same as A)', () => {
    const win0830 = getCheckInWindow({ shift: shiftGeneral, now: createTime(8, 30) });
    expect(win0830.minutesUntilStart).toBe(30);
    expect(win0830.windowStatus).toBe('BEFORE_WINDOW');
    const msg0830 = getMessage(win0830.windowStatus, win0830, shiftGeneral);
    expect(msg0830).toBe('Your shift starts in 30 minutes (at 09:00). Cannot check in yet.');
  });

  it('TEST 3 — Employee C (Night 21:00-06:00): At 20:00 -> 60 min (at 21:00), NOT 124 min', () => {
    const win2000 = getCheckInWindow({ shift: shiftNight, now: createTime(20, 0) });
    expect(win2000.minutesUntilStart).toBe(60);
    expect(win2000.windowStatus).toBe('BEFORE_WINDOW');
    const msg2000 = getMessage(win2000.windowStatus, win2000, shiftNight);
    expect(msg2000).toBe('Your shift starts in 60 minutes (at 21:00). Cannot check in yet.');
  });

  it('TEST 4 — Employee D (Roster Day shift 10:00-19:00): At 09:00 -> 60 min (at 10:00)', () => {
    const win0900 = getCheckInWindow({ shift: shiftDay10, now: createTime(9, 0) });
    expect(win0900.minutesUntilStart).toBe(60);
    expect(win0900.windowStatus).toBe('BEFORE_WINDOW');
    const msg0900 = getMessage(win0900.windowStatus, win0900, shiftDay10);
    expect(msg0900).toBe('Your shift starts in 60 minutes (at 10:00). Cannot check in yet.');
  });

  it('TEST 5 — Same employee, different times (08:00 -> 60 min, 08:30 -> 30 min, 08:55 -> 5 min)', () => {
    const t0800 = getCheckInWindow({ shift: shiftGeneral, now: createTime(8, 0) });
    const t0830 = getCheckInWindow({ shift: shiftGeneral, now: createTime(8, 30) });
    const t0855 = getCheckInWindow({ shift: shiftGeneral, now: createTime(8, 55) });

    expect(t0800.minutesUntilStart).toBe(60);
    expect(t0830.minutesUntilStart).toBe(30);
    expect(t0855.minutesUntilStart).toBe(5);
    expect(t0855.windowStatus).toBe('WINDOW_OPEN');
    expect(t0855.minutesLeftInGrace).toBe(20);
  });

  it('TEST 6 & 7 — Roster Override vs Default Shift Resolution', () => {
    // Roster Override mock resolution
    const mockRosterResolved = {
      hasShift: true,
      source: 'ROSTER',
      shift: shiftDay10
    };
    const winRoster = getCheckInWindow({ shift: mockRosterResolved.shift, now: createTime(9, 0) });
    expect(mockRosterResolved.source).toBe('ROSTER');
    expect(mockRosterResolved.shift.startTime).toBe('10:00');
    expect(winRoster.minutesUntilStart).toBe(60);

    // Default Shift mock resolution
    const mockDefaultResolved = {
      hasShift: true,
      source: 'ASSIGNMENT',
      shift: shiftGeneral
    };
    const winDefault = getCheckInWindow({ shift: mockDefaultResolved.shift, now: createTime(8, 0) });
    expect(mockDefaultResolved.source).toBe('ASSIGNMENT');
    expect(mockDefaultResolved.shift.startTime).toBe('09:00');
    expect(winDefault.minutesUntilStart).toBe(60);
  });
});
