import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AttendanceCard from './AttendanceCard.jsx';
import { computeExtraBreakMinutes, computeExpectedCheckout } from '../../../../backend/src/modules/attendance/attendance.service.js';

describe('Expected Checkout & AttendanceCard Verification Suite (All 8 Tests)', () => {
  const shiftDay = {
    name: 'Day Shift',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    breakRules: [
      { breakType: 'SHORT', allocatedMinutes: 30 },
      { breakType: 'LUNCH', allocatedMinutes: 30 }
    ]
  };

  const shiftNight = {
    name: 'Night Shift',
    startTime: '21:00',
    endTime: '06:00',
    graceMinutes: 15,
    isNightShift: true,
    breakRules: [
      { breakType: 'SHORT', allocatedMinutes: 30 },
      { breakType: 'LUNCH', allocatedMinutes: 30 }
    ]
  };

  it('TEST 1 — Before check-in: expectedCheckout is null and UI displays "Not checked in yet"', () => {
    const { container } = render(
      <AttendanceCard
        attendance={null}
        breaks={[]}
        shift={{ shift: shiftDay, expectedCheckout: null, totalDelayMinutes: 0 }}
      />
    );
    expect(screen.getByText('Not checked in yet')).toBeInTheDocument();
    expect(screen.queryByText(/Expected:/)).toBeNull();
  });

  it('TEST 2 — On-time check-in, no breaks: Expected 06:00 PM, Delay 0 min', () => {
    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks: [] });
    expect(calc.totalDelayMinutes).toBe(0);

    const targetTime = new Date();
    targetTime.setHours(18, 0, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(9, 0, 0, 0),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: targetTime.toISOString()
        }}
        breaks={[]}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 0 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.queryByText(/\+.*min/)).toBeNull();
  });

  it('TEST 3 — On-time check-in, break within quota: Short 20, Lunch 25 -> extra 0 -> Expected 06:00 PM', () => {
    const breaks = [
      { breakType: 'SHORT', durationMinutes: 20 },
      { breakType: 'LUNCH', durationMinutes: 25 }
    ];
    const extra = computeExtraBreakMinutes({ shift: shiftDay, breaks });
    expect(extra).toBe(0);

    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks });
    expect(calc.totalDelayMinutes).toBe(0);

    const targetTime = new Date();
    targetTime.setHours(18, 0, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(9, 0, 0, 0),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 0
        }}
        breaks={breaks}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 0 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.queryByText(/\+.*min/)).toBeNull();
  });

  it('TEST 4 — Lunch exceeded: Short 10 (0 extra), Lunch 45 (15 extra) -> Expected 06:15 PM, Delay +15 min', () => {
    const breaks = [
      { breakType: 'SHORT', durationMinutes: 10 },
      { breakType: 'LUNCH', durationMinutes: 45 }
    ];
    const extra = computeExtraBreakMinutes({ shift: shiftDay, breaks });
    expect(extra).toBe(15);

    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks });
    expect(calc.totalDelayMinutes).toBe(15);
    expect(calc.extraBreakMinutes).toBe(15);

    const targetTime = new Date();
    targetTime.setHours(18, 15, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(9, 0, 0, 0),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 15,
          extraBreakMinutes: 15
        }}
        breaks={breaks}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 15, lateMinutes: 0, extraBreakMinutes: 15 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.getByText(/\+15 min/)).toBeInTheDocument();
    expect(screen.getByText(/extra break 15/)).toBeInTheDocument();
  });

  it('TEST 5 — Late + lunch exceeded: Late 60 + Lunch 45 (15 extra) -> Expected 07:15 PM, Delay +75 min', () => {
    const breaks = [
      { breakType: 'LUNCH', durationMinutes: 45 }
    ];
    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 60, breaks });
    expect(calc.totalDelayMinutes).toBe(75);
    expect(calc.lateMinutes).toBe(60);
    expect(calc.extraBreakMinutes).toBe(15);

    const targetTime = new Date();
    targetTime.setHours(19, 15, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(10, 0, 0, 0),
          status: 'LATE',
          lateMinutes: 60,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 75,
          extraBreakMinutes: 15
        }}
        breaks={breaks}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 75, lateMinutes: 60, extraBreakMinutes: 15 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.getByText(/\+75 min/)).toBeInTheDocument();
    expect(screen.getByText(/late 60/)).toBeInTheDocument();
    expect(screen.getByText(/extra break 15/)).toBeInTheDocument();
  });

  it('TEST 6 — Short exceeded, lunch within: Short 45 (15 extra), Lunch 20 (0 extra) -> Expected 06:15 PM, Delay +15 min', () => {
    const breaks = [
      { breakType: 'SHORT', durationMinutes: 45 },
      { breakType: 'LUNCH', durationMinutes: 20 }
    ];
    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks });
    expect(calc.totalDelayMinutes).toBe(15);
    expect(calc.extraBreakMinutes).toBe(15);

    const targetTime = new Date();
    targetTime.setHours(18, 15, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(9, 0, 0, 0),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 15,
          extraBreakMinutes: 15
        }}
        breaks={breaks}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 15, lateMinutes: 0, extraBreakMinutes: 15 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.getByText(/\+15 min/)).toBeInTheDocument();
    expect(screen.getByText(/extra break 15/)).toBeInTheDocument();
  });

  it('TEST 7 — Both exceeded: Short 45 (15 extra), Lunch 45 (15 extra) -> Expected 06:30 PM, Delay +30 min', () => {
    const breaks = [
      { breakType: 'SHORT', durationMinutes: 45 },
      { breakType: 'LUNCH', durationMinutes: 45 }
    ];
    const calc = computeExpectedCheckout({ shift: shiftDay, lateMinutes: 0, breaks });
    expect(calc.totalDelayMinutes).toBe(30);
    expect(calc.extraBreakMinutes).toBe(30);

    const targetTime = new Date();
    targetTime.setHours(18, 30, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(9, 0, 0, 0),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 30,
          extraBreakMinutes: 30
        }}
        breaks={breaks}
        shift={{ shift: shiftDay, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 30, lateMinutes: 0, extraBreakMinutes: 30 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.getByText(/\+30 min/)).toBeInTheDocument();
    expect(screen.getByText(/extra break 30/)).toBeInTheDocument();
  });

  it('TEST 8 — Night roster shift: 21:00-06:00, Late 60, Lunch 45 (15 extra) -> Expected 07:15 AM, Delay +75 min', () => {
    const breaks = [
      { breakType: 'LUNCH', durationMinutes: 45 }
    ];
    const calc = computeExpectedCheckout({ shift: shiftNight, lateMinutes: 60, breaks });
    expect(calc.totalDelayMinutes).toBe(75);
    expect(calc.lateMinutes).toBe(60);
    expect(calc.extraBreakMinutes).toBe(15);

    const targetTime = new Date();
    targetTime.setDate(targetTime.getDate() + 1);
    targetTime.setHours(7, 15, 0, 0);

    render(
      <AttendanceCard
        attendance={{
          checkInAt: new Date().setHours(22, 0, 0, 0),
          status: 'LATE',
          lateMinutes: 60,
          adjustedCheckOutTime: targetTime.toISOString(),
          totalDelayMinutes: 75,
          extraBreakMinutes: 15
        }}
        breaks={breaks}
        shift={{ shift: shiftNight, expectedCheckout: targetTime.toISOString(), totalDelayMinutes: 75, lateMinutes: 60, extraBreakMinutes: 15 }}
      />
    );
    expect(screen.getByText(/Expected:/)).toBeInTheDocument();
    expect(screen.getByText(/\+75 min/)).toBeInTheDocument();
    expect(screen.getByText(/late 60/)).toBeInTheDocument();
    expect(screen.getByText(/extra break 15/)).toBeInTheDocument();
  });
});
