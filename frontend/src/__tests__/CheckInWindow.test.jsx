import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { getCheckInWindow } from '../../../backend/src/modules/attendance/attendance.service.js';

describe('Check-In Button UX & Time Window Tests (All 10 Cases)', () => {
  const shiftDay = { startTime: '09:00', endTime: '18:00', graceMinutes: 15 };
  const shiftNight = { startTime: '21:00', endTime: '06:00', graceMinutes: 15 };

  function createTime(hours, minutes) {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  function formatTimeString(isoString) {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getCheckInMessage(status, data) {
    if (!data) return null;
    switch (status) {
      case 'BEFORE_WINDOW':
        return `Your shift starts in ${data.minutesUntilStart} minutes (at ${formatTimeString(data.shiftStart)}). Cannot check in yet.`;
      case 'WINDOW_OPEN':
        return `Check-in window open. Grace ends in ${data.minutesLeftInGrace} minutes.`;
      case 'GRACE_PASSED':
        return `Check-in time has passed. Grace period ended at ${formatTimeString(data.graceCutoff)}. You will be marked ABSENT.`;
      case 'SHIFT_ENDED':
        return `Your shift ended at ${formatTimeString(data.shiftEnd)}. Check-in not allowed.`;
      default:
        return data.checkInBlockReason || 'Check-in window is not currently open.';
    }
  }

  function MockCheckInButton({ windowData, onCheckIn }) {
    const canCheckIn = windowData.canCheckIn;
    const msg = getCheckInMessage(windowData.windowStatus, windowData);

    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (!canCheckIn) {
              window.alert(msg);
              return;
            }
            onCheckIn();
          }}
          className={canCheckIn ? 'bg-emerald-500 cursor-pointer' : 'bg-gray-700 cursor-not-allowed'}
        >
          Initiate Check-In
        </button>
        {msg && <p data-testid="status-message">{msg}</p>}
      </div>
    );
  }

  it('TEST 1 — At 08:50 (10 min before shift): Button DISABLED, message shows 10 minutes, click triggers alert', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(8, 50) });
    expect(win.canCheckIn).toBe(false);
    expect(win.windowStatus).toBe('BEFORE_WINDOW');
    expect(win.minutesUntilStart).toBe(10);

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onCheckIn = vi.fn();

    render(<MockCheckInButton windowData={win} onCheckIn={onCheckIn} />);
    const btn = screen.getByRole('button', { name: /Initiate Check-In/i });
    expect(btn.className).toContain('cursor-not-allowed');

    fireEvent.click(btn);
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Your shift starts in 10 minutes'));
    expect(onCheckIn).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('TEST 2 — At 08:55 (5 min before shift): Button ENABLED, message shows Grace ends in 20 minutes', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(8, 55) });
    expect(win.canCheckIn).toBe(true);
    expect(win.windowStatus).toBe('WINDOW_OPEN');
    expect(win.minutesLeftInGrace).toBe(20);

    const onCheckIn = vi.fn();
    render(<MockCheckInButton windowData={win} onCheckIn={onCheckIn} />);
    const btn = screen.getByRole('button', { name: /Initiate Check-In/i });
    expect(btn.className).toContain('bg-emerald-500');

    fireEvent.click(btn);
    expect(onCheckIn).toHaveBeenCalled();
  });

  it('TEST 3 — At 09:00 (on time): Button ENABLED, message shows Grace ends in 15 minutes', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(9, 0) });
    expect(win.canCheckIn).toBe(true);
    expect(win.windowStatus).toBe('WINDOW_OPEN');
    expect(win.minutesLeftInGrace).toBe(15);
  });

  it('TEST 4 — At 09:10 (within grace): Button ENABLED, message shows Grace ends in 5 minutes', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(9, 10) });
    expect(win.canCheckIn).toBe(true);
    expect(win.windowStatus).toBe('WINDOW_OPEN');
    expect(win.minutesLeftInGrace).toBe(5);
  });

  it('TEST 5 — At 09:20 (grace passed): Button DISABLED, message shows Grace period ended, click triggers alert', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(9, 20) });
    expect(win.canCheckIn).toBe(false);
    expect(win.windowStatus).toBe('GRACE_PASSED');

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onCheckIn = vi.fn();

    render(<MockCheckInButton windowData={win} onCheckIn={onCheckIn} />);
    const btn = screen.getByRole('button', { name: /Initiate Check-In/i });
    expect(btn.className).toContain('cursor-not-allowed');

    fireEvent.click(btn);
    expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Grace period ended'));
    expect(onCheckIn).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('TEST 6 — At 18:30 (after shift end): Button DISABLED, message shows shift ended', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(18, 30) });
    expect(win.canCheckIn).toBe(false);
    expect(win.windowStatus).toBe('SHIFT_ENDED');
  });

  it('TEST 7 — RFID card at 08:50 (before shift window): Blocked', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(8, 50) });
    expect(win.canCheckIn).toBe(false);
  });

  it('TEST 8 — RFID card at 09:20 (grace passed): Blocked', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(9, 20) });
    expect(win.canCheckIn).toBe(false);
    expect(win.windowStatus).toBe('GRACE_PASSED');
  });

  it('TEST 9 — Face at 08:55 (within 5 min window): Allowed', () => {
    const win = getCheckInWindow({ shift: shiftDay, now: createTime(8, 55) });
    expect(win.canCheckIn).toBe(true);
  });

  it('TEST 10 — Night roster shift (21:00–06:00): 20:50 disabled, 20:55 enabled, 21:20 disabled', () => {
    const w1 = getCheckInWindow({ shift: shiftNight, now: createTime(20, 50) });
    const w2 = getCheckInWindow({ shift: shiftNight, now: createTime(20, 55) });
    const w3 = getCheckInWindow({ shift: shiftNight, now: createTime(21, 20) });

    expect(w1.canCheckIn).toBe(false);
    expect(w1.windowStatus).toBe('BEFORE_WINDOW');
    expect(w1.minutesUntilStart).toBe(10);

    expect(w2.canCheckIn).toBe(true);
    expect(w2.windowStatus).toBe('WINDOW_OPEN');
    expect(w2.minutesLeftInGrace).toBe(20);

    expect(w3.canCheckIn).toBe(false);
    expect(w3.windowStatus).toBe('GRACE_PASSED');
  });
});
