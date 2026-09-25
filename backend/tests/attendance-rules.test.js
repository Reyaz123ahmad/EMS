import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import { attendanceRules } from '../src/modules/attendance/attendance.rules.js';

describe('Advanced Attendance Rules Engine', { timeout: 20000 }, () => {
  let testCompany;
  let testBranch;
  let testEmployeeWithShift;
  let testEmployeeNoShift;
  let testShift;
  let testCalendar;
  let testHoliday;

  beforeAll(async () => {
    // 1. Create a Test Company with customized attendance settings
    testCompany = await prisma.company.create({
      data: {
        name: 'Attendance Rules Test Corp',
        domain: `test-corp-${Date.now()}.com`,
        attendanceSettings: {
          holidayCheck: {
            enabled: true,
            blockAttendanceOnHoliday: true,
            markHolidayAutomatically: true
          },
          shiftCheck: {
            enabled: true,
            requireShiftAssignment: true,
            blockAttendanceWithoutShift: true
          },
          lateRules: {
            enabled: true,
            graceMinutes: 15,
            autoExtendCheckout: true,
            extendByLateMinutes: true
          },
          checkoutRules: {
            enabled: true,
            requireFullHours: true,
            disableButtonUntilFullTime: true,
            workingHours: 8
          },
          breakRules: {
            enabled: true,
            maxBreaksPerDay: 2,
            maxBreakMinutesPerDay: 45,
            breakTypes: ['LUNCH', 'SHORT'],
            lunchDurationMinutes: 30,
            shortDurationMinutes: 15,
            trackReturnTime: true,
            extendCheckoutOnLateReturn: true,
            disableButtonOnLimit: true
          }
        }
      }
    });

    testBranch = await prisma.branch.create({
      data: {
        companyId: testCompany.id,
        name: 'Main HQ',
        latitude: 28.6139,
        longitude: 77.2090,
        geofenceRadius: 1000
      }
    });

    // 2. Create Shifts
    testShift = await prisma.shift.create({
      data: {
        companyId: testCompany.id,
        name: 'Morning General Shift',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        workingHours: 8
      }
    });

    // 3. Create Employees
    testEmployeeWithShift = await prisma.employee.create({
      data: {
        companyId: testCompany.id,
        branchId: testBranch.id,
        employeeCode: `EMP-S-${Date.now()}`,
        firstName: 'Alice',
        lastName: 'Shifted',
        email: `alice.${Date.now()}@test.com`,
        joiningDate: new Date()
      }
    });

    testEmployeeNoShift = await prisma.employee.create({
      data: {
        companyId: testCompany.id,
        branchId: testBranch.id,
        employeeCode: `EMP-NS-${Date.now()}`,
        firstName: 'Bob',
        lastName: 'Unassigned',
        email: `bob.${Date.now()}@test.com`,
        joiningDate: new Date()
      }
    });

    // 4. Assign Shift to Alice
    await prisma.shiftAssignment.create({
      data: {
        employeeId: testEmployeeWithShift.id,
        shiftId: testShift.id,
        effectiveFrom: new Date('2026-01-01')
      }
    });

    // 5. Create Holiday Calendar and Festival Holiday for Tomorrow
    const currentYear = new Date().getFullYear();
    testCalendar = await prisma.holidayCalendar.create({
      data: {
        companyId: testCompany.id,
        name: `${currentYear} Corporate Calendar`,
        year: currentYear,
        isActive: true
      }
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    testHoliday = await prisma.festivalHoliday.create({
      data: {
        calendarId: testCalendar.id,
        name: 'Founders Memorial Day',
        date: tomorrow,
        isMandatory: true,
        description: 'Annual corporate celebration holiday'
      }
    });
  });

  afterAll(async () => {
    // Clean up created entities
    try {
      if (testHoliday) await prisma.festivalHoliday.deleteMany({ where: { calendarId: testCalendar?.id } });
      if (testCalendar) await prisma.holidayCalendar.deleteMany({ where: { companyId: testCompany?.id } });
      if (testEmployeeWithShift) await prisma.shiftAssignment.deleteMany({ where: { employeeId: testEmployeeWithShift.id } });
      if (testCompany) {
        await prisma.attendanceBreak.deleteMany({ where: { employee: { companyId: testCompany.id } } });
        await prisma.attendanceLog.deleteMany({ where: { companyId: testCompany.id } });
        await prisma.employee.deleteMany({ where: { companyId: testCompany.id } });
        await prisma.shift.deleteMany({ where: { companyId: testCompany.id } });
        await prisma.branch.deleteMany({ where: { companyId: testCompany.id } });
        await prisma.company.delete({ where: { id: testCompany.id } });
      }
    } catch (e) {
      // Ignore cleanup error
    }
  });

  // ==========================================
  // PART 1: HOLIDAY CHECK
  // ==========================================
  describe('Holiday Check Rules', () => {
    it('identifies an upcoming festival holiday correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const holidayRes = await attendanceService.checkHoliday(testCompany.id, tomorrow);
      expect(holidayRes.isHoliday).toBe(true);
      expect(holidayRes.holiday.name).toBe('Founders Memorial Day');
      expect(holidayRes.holiday.isMandatory).toBe(true);
    });

    it('returns isHoliday false on a normal working day', async () => {
      const regularDay = new Date('2026-06-15');
      const holidayRes = await attendanceService.checkHoliday(testCompany.id, regularDay);
      expect(holidayRes.isHoliday).toBe(false);
      expect(holidayRes.holiday).toBeNull();
    });
  });

  // ==========================================
  // PART 2: SHIFT ASSIGNMENT CHECK
  // ==========================================
  describe('Shift Assignment Rules', () => {
    it('returns hasShift true and shift details for assigned employee', async () => {
      const shiftCheck = await attendanceService.checkShiftAssignment(testEmployeeWithShift.id, new Date());
      expect(shiftCheck.hasShift).toBe(true);
      expect(shiftCheck.shift.name).toBe('Morning General Shift');
      expect(shiftCheck.shift.startTime).toBe('09:00');
      expect(shiftCheck.shift.endTime).toBe('18:00');
    });

    it('returns hasShift false for unassigned employee when no company fallback exists', async () => {
      const shiftCheck = await attendanceService.checkShiftAssignment(testEmployeeNoShift.id, new Date(), null);
      expect(shiftCheck.hasShift).toBe(false);
    });
  });

  // ==========================================
  // PART 3: SHIFT TIMING & LATE CALCULATION
  // ==========================================
  describe('Shift Timing & Late Calculation', () => {
    it('calculates on-time arrival within grace period (09:10 AM vs 09:00 AM + 15m grace)', () => {
      const checkInDate = new Date();
      checkInDate.setHours(9, 10, 0, 0);

      const lateCalc = attendanceService.calculateLateMinutes(checkInDate, testShift, 15);
      expect(lateCalc.isLate).toBe(false);
      expect(lateCalc.lateMinutes).toBe(0);
    });

    it('calculates late minutes accurately beyond grace period (09:40 AM vs 09:00 AM)', () => {
      const checkInDate = new Date();
      checkInDate.setHours(9, 40, 0, 0);

      const lateCalc = attendanceService.calculateLateMinutes(checkInDate, testShift, 15);
      expect(lateCalc.isLate).toBe(true);
      expect(lateCalc.lateMinutes).toBe(40);
    });
  });

  // ==========================================
  // PART 4: AUTO CHECKOUT EXTENSION & WORKING HOURS
  // ==========================================
  describe('Auto Checkout Extension & Checkout Status', () => {
    it('evaluates checkout readiness correctly before full hours are met', async () => {
      const status = await attendanceService.canCheckout(testEmployeeWithShift.id, testCompany.id);
      expect(status.canCheckout).toBe(false);
      expect(status.reason).toBeDefined();
    });
  });

  // ==========================================
  // PART 5: BREAK QUOTA & TYPE LIMITS
  // ==========================================
  describe('Break Limits & Type Rules', () => {
    it('allows taking first break with initial quota (2 breaks / 45 mins)', async () => {
      const breakLimit = await attendanceService.checkBreakLimit(testEmployeeWithShift.id, testCompany.id);
      expect(breakLimit.canTakeBreak).toBe(true);
      expect(breakLimit.maxBreaks).toBe(2);
      expect(breakLimit.maxBreakMinutes).toBe(45);
      expect(breakLimit.lunchDurationMinutes).toBe(30);
      expect(breakLimit.shortDurationMinutes).toBe(15);
    });
  });
});
