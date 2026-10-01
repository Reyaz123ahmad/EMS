import React from 'react';
import AttendanceCard from '../../components/attendance/AttendanceCard.jsx';

export default function ExpectedCheckoutTestPage() {
  const shiftDay = {
    name: 'Day Shift (09:00 - 18:00)',
    startTime: '09:00',
    endTime: '18:00',
    graceMinutes: 15,
    breakRules: [
      { breakType: 'SHORT', allocatedMinutes: 30 },
      { breakType: 'LUNCH', allocatedMinutes: 30 }
    ]
  };

  const shiftNight = {
    name: 'Night Shift (21:00 - 06:00)',
    startTime: '21:00',
    endTime: '06:00',
    graceMinutes: 15,
    isNightShift: true,
    breakRules: [
      { breakType: 'SHORT', allocatedMinutes: 30 },
      { breakType: 'LUNCH', allocatedMinutes: 30 }
    ]
  };

  const testCases = [
    {
      id: 1,
      title: 'TEST 1 — Before check-in',
      description: 'UI must hide Expected checkout and show "Not checked in yet"',
      expected: 'Not checked in yet (No Expected shown)',
      cardProps: {
        attendance: null,
        breaks: [],
        shift: { shift: shiftDay, expectedCheckout: null, totalDelayMinutes: 0, lateMinutes: 0, extraBreakMinutes: 0 }
      }
    },
    {
      id: 2,
      title: 'TEST 2 — On-time check-in, no breaks',
      description: 'Shift 09:00–18:00, Check-in 09:00',
      expected: 'Expected: 06:00 PM (Delay: 0 min)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
          totalDelayMinutes: 0,
          extraBreakMinutes: 0
        },
        breaks: [],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(), totalDelayMinutes: 0, lateMinutes: 0, extraBreakMinutes: 0 }
      }
    },
    {
      id: 3,
      title: 'TEST 3 — On-time check-in, break within quota',
      description: 'Short: 20 min (quota 30), Lunch: 25 min (quota 30)',
      expected: 'Expected: 06:00 PM (Delay: 0 min)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
          totalDelayMinutes: 0,
          extraBreakMinutes: 0
        },
        breaks: [
          { breakType: 'SHORT', totalBreakMinutes: 20 },
          { breakType: 'LUNCH', totalBreakMinutes: 25 }
        ],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(), totalDelayMinutes: 0, lateMinutes: 0, extraBreakMinutes: 0 }
      }
    },
    {
      id: 4,
      title: 'TEST 4 — Lunch exceeded',
      description: 'Short: 10 min (quota 30) → 0 extra, Lunch: 45 min (quota 30) → 15 extra',
      expected: 'Expected: 06:15 PM (+15 min)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: new Date(new Date().setHours(18, 15, 0, 0)).toISOString(),
          totalDelayMinutes: 15,
          extraBreakMinutes: 15
        },
        breaks: [
          { breakType: 'SHORT', totalBreakMinutes: 10 },
          { breakType: 'LUNCH', totalBreakMinutes: 45 }
        ],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(18, 15, 0, 0)).toISOString(), totalDelayMinutes: 15, lateMinutes: 0, extraBreakMinutes: 15 }
      }
    },
    {
      id: 5,
      title: 'TEST 5 — Late + lunch exceeded',
      description: 'Check-in: 10:00 (60 min late), Lunch: 45 min (quota 30) → 15 extra',
      expected: 'Expected: 07:15 PM (+75 min: 60 late + 15 break)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
          status: 'LATE',
          lateMinutes: 60,
          adjustedCheckOutTime: new Date(new Date().setHours(19, 15, 0, 0)).toISOString(),
          totalDelayMinutes: 75,
          extraBreakMinutes: 15
        },
        breaks: [
          { breakType: 'LUNCH', totalBreakMinutes: 45 }
        ],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(19, 15, 0, 0)).toISOString(), totalDelayMinutes: 75, lateMinutes: 60, extraBreakMinutes: 15 }
      }
    },
    {
      id: 6,
      title: 'TEST 6 — Short exceeded, lunch within',
      description: 'Short: 45 min (quota 30) → 15 extra, Lunch: 20 min (quota 30) → 0 extra',
      expected: 'Expected: 06:15 PM (+15 min)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: new Date(new Date().setHours(18, 15, 0, 0)).toISOString(),
          totalDelayMinutes: 15,
          extraBreakMinutes: 15
        },
        breaks: [
          { breakType: 'SHORT', totalBreakMinutes: 45 },
          { breakType: 'LUNCH', totalBreakMinutes: 20 }
        ],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(18, 15, 0, 0)).toISOString(), totalDelayMinutes: 15, lateMinutes: 0, extraBreakMinutes: 15 }
      }
    },
    {
      id: 7,
      title: 'TEST 7 — Both exceeded',
      description: 'Short: 45 min (quota 30) → 15 extra, Lunch: 45 min (quota 30) → 15 extra',
      expected: 'Expected: 06:30 PM (+30 min)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          status: 'PRESENT',
          lateMinutes: 0,
          adjustedCheckOutTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(),
          totalDelayMinutes: 30,
          extraBreakMinutes: 30
        },
        breaks: [
          { breakType: 'SHORT', totalBreakMinutes: 45 },
          { breakType: 'LUNCH', totalBreakMinutes: 45 }
        ],
        shift: { shift: shiftDay, expectedCheckout: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), totalDelayMinutes: 30, lateMinutes: 0, extraBreakMinutes: 30 }
      }
    },
    {
      id: 8,
      title: 'TEST 8 — Night roster shift',
      description: 'Shift: 21:00–06:00, Late check-in: 22:00 (60 min), Lunch extra: 15 min',
      expected: 'Expected: 07:15 AM (+75 min: 60 late + 15 break)',
      cardProps: {
        attendance: {
          checkInAt: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
          status: 'LATE',
          lateMinutes: 60,
          adjustedCheckOutTime: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(7, 15, 0, 0);
            return d.toISOString();
          })(),
          totalDelayMinutes: 75,
          extraBreakMinutes: 15
        },
        breaks: [
          { breakType: 'LUNCH', totalBreakMinutes: 45 }
        ],
        shift: {
          shift: shiftNight,
          expectedCheckout: (() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            d.setHours(7, 15, 0, 0);
            return d.toISOString();
          })(),
          totalDelayMinutes: 75,
          lateMinutes: 60,
          extraBreakMinutes: 15
        }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-2 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Expected Checkout Verification Suite
        </h1>
        <p className="text-sm text-slate-400">
          Visual verification of all 8 test cases for Expected Checkout computation and AttendanceCard rendering.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {testCases.map((tc) => (
          <div key={tc.id} id={`test-case-${tc.id}`} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h2 className="text-lg font-bold text-indigo-300">{tc.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{tc.description}</p>
              </div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-3 py-1 rounded-full border border-indigo-500/30">
                Target: {tc.expected}
              </span>
            </div>

            <AttendanceCard
              attendance={tc.cardProps.attendance}
              breaks={tc.cardProps.breaks}
              shift={tc.cardProps.shift}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
