import '../src/config/env.js';
import { getCheckInWindow, getShiftWindow } from '../src/modules/attendance/attendance.service.js';
import { resolveShiftForEmployee, clearShiftResolutionCache } from '../src/modules/shifts/services/shift-resolver.service.js';
import { prisma } from '../src/config/prisma.js';

function createTimeOnDate(baseDate, hours, minutes) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function runTests() {
  console.log('============================================================');
  console.log('PHASE 3 VERIFICATION: MULTI-USER COUNTDOWN & SHIFT TESTS');
  console.log('============================================================\n');

  clearShiftResolutionCache();

  // Find or create test company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Test Enterprise Corp',
        code: 'TESTCORP_' + Date.now(),
        email: 'test' + Date.now() + '@corp.com',
        phone: '9876543210'
      }
    });
  }

  // Set up shifts
  let shiftGeneral = await prisma.shift.findFirst({ where: { companyId: company.id, name: 'General Shift' } });
  if (!shiftGeneral) {
    shiftGeneral = await prisma.shift.create({
      data: { companyId: company.id, name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15, isActive: true }
    });
  } else {
    shiftGeneral = await prisma.shift.update({
      where: { id: shiftGeneral.id },
      data: { startTime: '09:00', endTime: '18:00', graceMinutes: 15, isActive: true }
    });
  }

  let shiftNight = await prisma.shift.findFirst({ where: { companyId: company.id, name: 'Night Shift' } });
  if (!shiftNight) {
    shiftNight = await prisma.shift.create({
      data: { companyId: company.id, name: 'Night Shift', startTime: '21:00', endTime: '06:00', graceMinutes: 15, isNightShift: true, isActive: true }
    });
  } else {
    shiftNight = await prisma.shift.update({
      where: { id: shiftNight.id },
      data: { startTime: '21:00', endTime: '06:00', graceMinutes: 15, isNightShift: true, isActive: true }
    });
  }

  let shiftDay10 = await prisma.shift.findFirst({ where: { companyId: company.id, name: 'Day Shift' } });
  if (!shiftDay10) {
    shiftDay10 = await prisma.shift.create({
      data: { companyId: company.id, name: 'Day Shift', startTime: '10:00', endTime: '19:00', graceMinutes: 15, isActive: true }
    });
  } else {
    shiftDay10 = await prisma.shift.update({
      where: { id: shiftDay10.id },
      data: { startTime: '10:00', endTime: '19:00', graceMinutes: 15, isActive: true }
    });
  }

  // Set up Employees cleanly
  async function getOrCreateEmployee(code, firstName, lastName) {
    let emp = await prisma.employee.findFirst({ where: { companyId: company.id, employeeCode: code } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: { companyId: company.id, employeeCode: code, firstName, lastName, joiningDate: new Date() }
      });
    }
    return emp;
  }

  const empA = await getOrCreateEmployee('EMP_A_COUNTDOWN', 'Employee', 'A');
  const empB = await getOrCreateEmployee('EMP_B_COUNTDOWN', 'Employee', 'B');
  const empC = await getOrCreateEmployee('EMP_C_COUNTDOWN', 'Employee', 'C');
  const empD = await getOrCreateEmployee('EMP_D_COUNTDOWN', 'Employee', 'D');

  // Assign Shifts:
  // empA -> General Shift (09:00 - 18:00)
  // empB -> General Shift (09:00 - 18:00)
  // empC -> Night Shift (21:00 - 06:00)
  // empD -> Roster Day Shift (10:00 - 19:00)
  await prisma.shiftAssignment.deleteMany({ where: { employeeId: { in: [empA.id, empB.id, empC.id, empD.id] } } });
  await prisma.roster.deleteMany({ where: { employeeId: { in: [empA.id, empB.id, empC.id, empD.id] } } });

  await prisma.shiftAssignment.create({
    data: { employeeId: empA.id, shiftId: shiftGeneral.id, effectiveFrom: new Date('2020-01-01') }
  });
  await prisma.shiftAssignment.create({
    data: { employeeId: empB.id, shiftId: shiftGeneral.id, effectiveFrom: new Date('2020-01-01') }
  });
  await prisma.shiftAssignment.create({
    data: { employeeId: empC.id, shiftId: shiftNight.id, effectiveFrom: new Date('2020-01-01') }
  });
  // empD has default General shift, but active published Roster to Day Shift 10:00
  await prisma.shiftAssignment.create({
    data: { employeeId: empD.id, shiftId: shiftGeneral.id, effectiveFrom: new Date('2020-01-01') }
  });

  const testDate = new Date();
  const todayDateOnly = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
  await prisma.roster.create({
    data: {
      companyId: company.id,
      employeeId: empD.id,
      shiftId: shiftDay10.id,
      date: todayDateOnly,
      isPublished: true
    }
  });

  clearShiftResolutionCache();

  // ============================================================
  // TEST 1 — Employee A (General 09:00-18:00) at 08:00 AM & 12:26 PM
  // ============================================================
  console.log('--- TEST 1: Employee A (General 09:00 - 18:00) ---');
  const shiftA = await resolveShiftForEmployee({ employeeId: empA.id, companyId: company.id, date: testDate });
  const timeA_0800 = createTimeOnDate(testDate, 8, 0);
  const winA_0800 = getCheckInWindow({ shift: shiftA.shift, now: timeA_0800, date: testDate });
  console.log('At 08:00 AM:');
  console.log(`  Shift Name: ${shiftA.shift.name} (${shiftA.shift.startTime} - ${shiftA.shift.endTime})`);
  console.log(`  minutesUntilStart: ${winA_0800.minutesUntilStart} (Expected: 60)`);
  console.log(`  windowStatus: ${winA_0800.windowStatus} (Expected: BEFORE_WINDOW)`);
  console.log(`  Message: "${winA_0800.checkInBlockReason}"`);

  const timeA_1226 = createTimeOnDate(testDate, 12, 26);
  const winA_1226 = getCheckInWindow({ shift: shiftA.shift, now: timeA_1226, date: testDate });
  console.log('At 12:26 PM:');
  console.log(`  minutesUntilStart: ${winA_1226.minutesUntilStart} (Expected: 0)`);
  console.log(`  windowStatus: ${winA_1226.windowStatus} (Expected: GRACE_PASSED)`);
  console.log(`  Message: "${winA_1226.checkInBlockReason}"`);

  const test1Pass = winA_0800.minutesUntilStart === 60 && winA_1226.windowStatus === 'GRACE_PASSED' && winA_1226.minutesUntilStart === 0;
  console.log(`Result: ${test1Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // ============================================================
  // TEST 2 — Employee B (General 09:00-18:00) at 08:30 AM
  // ============================================================
  console.log('--- TEST 2: Employee B at 08:30 AM ---');
  const shiftB = await resolveShiftForEmployee({ employeeId: empB.id, companyId: company.id, date: testDate });
  const timeB_0830 = createTimeOnDate(testDate, 8, 30);
  const winB_0830 = getCheckInWindow({ shift: shiftB.shift, now: timeB_0830, date: testDate });
  console.log(`  Shift Name: ${shiftB.shift.name} (${shiftB.shift.startTime} - ${shiftB.shift.endTime})`);
  console.log(`  minutesUntilStart: ${winB_0830.minutesUntilStart} (Expected: 30)`);
  console.log(`  windowStatus: ${winB_0830.windowStatus} (Expected: BEFORE_WINDOW)`);
  const test2Pass = winB_0830.minutesUntilStart === 30 && winB_0830.minutesUntilStart !== winA_0800.minutesUntilStart;
  console.log(`Result: ${test2Pass ? '✅ PASS (30 min != 60 min)' : '❌ FAIL'}\n`);

  // ============================================================
  // TEST 3 — Employee C (Night 21:00-06:00) at 20:00
  // ============================================================
  console.log('--- TEST 3: Employee C (Night Shift 21:00 - 06:00) at 20:00 ---');
  const shiftC = await resolveShiftForEmployee({ employeeId: empC.id, companyId: company.id, date: testDate });
  const timeC_2000 = createTimeOnDate(testDate, 20, 0);
  const winC_2000 = getCheckInWindow({ shift: shiftC.shift, now: timeC_2000, date: testDate });
  console.log(`  Shift Name: ${shiftC.shift.name} (${shiftC.shift.startTime} - ${shiftC.shift.endTime})`);
  console.log(`  minutesUntilStart: ${winC_2000.minutesUntilStart} (Expected: 60)`);
  console.log(`  windowStatus: ${winC_2000.windowStatus} (Expected: BEFORE_WINDOW)`);
  console.log(`  Message: "${winC_2000.checkInBlockReason}"`);
  const test3Pass = shiftC.shift.startTime === '21:00' && winC_2000.minutesUntilStart === 60;
  console.log(`Result: ${test3Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // ============================================================
  // TEST 4 — Employee D (Roster Day shift 10:00-19:00) at 09:00
  // ============================================================
  console.log('--- TEST 4: Employee D (Roster Day Shift 10:00 - 19:00) at 09:00 ---');
  const shiftD = await resolveShiftForEmployee({ employeeId: empD.id, companyId: company.id, date: testDate });
  const timeD_0900 = createTimeOnDate(testDate, 9, 0);
  const winD_0900 = getCheckInWindow({ shift: shiftD.shift, now: timeD_0900, date: testDate });
  console.log(`  Resolved Source: ${shiftD.source} (Expected: ROSTER)`);
  console.log(`  Shift Name: ${shiftD.shift.name} (${shiftD.shift.startTime} - ${shiftD.shift.endTime})`);
  console.log(`  minutesUntilStart: ${winD_0900.minutesUntilStart} (Expected: 60)`);
  console.log(`  Message: "${winD_0900.checkInBlockReason}"`);
  const test4Pass = shiftD.source === 'ROSTER' && shiftD.shift.startTime === '10:00' && winD_0900.minutesUntilStart === 60;
  console.log(`Result: ${test4Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // ============================================================
  // TEST 5 — Same employee, different times (08:00, 08:30, 08:55)
  // ============================================================
  console.log('--- TEST 5: Same Employee at Different Times ---');
  const t0800 = getCheckInWindow({ shift: shiftGeneral, now: createTimeOnDate(testDate, 8, 0), date: testDate });
  const t0830 = getCheckInWindow({ shift: shiftGeneral, now: createTimeOnDate(testDate, 8, 30), date: testDate });
  const t0855 = getCheckInWindow({ shift: shiftGeneral, now: createTimeOnDate(testDate, 8, 55), date: testDate });
  console.log(`  At 08:00 -> minutesUntilStart: ${t0800.minutesUntilStart}, windowStatus: ${t0800.windowStatus}`);
  console.log(`  At 08:30 -> minutesUntilStart: ${t0830.minutesUntilStart}, windowStatus: ${t0830.windowStatus}`);
  console.log(`  At 08:55 -> minutesUntilStart: ${t0855.minutesUntilStart}, windowStatus: ${t0855.windowStatus}`);
  const test5Pass = t0800.minutesUntilStart === 60 && t0830.minutesUntilStart === 30 && t0855.minutesUntilStart === 5 && t0855.windowStatus === 'WINDOW_OPEN';
  console.log(`Result: ${test5Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  // ============================================================
  // TEST 6 & 7 — Roster override vs No Roster fallback
  // ============================================================
  console.log('--- TEST 6 & 7: Roster Override vs Default Shift ---');
  console.log(`  With Roster (Emp D): Source = ${shiftD.source}, Shift = ${shiftD.shift.name} (${shiftD.shift.startTime})`);
  console.log(`  Without Roster (Emp A): Source = ${shiftA.source}, Shift = ${shiftA.shift.name} (${shiftA.shift.startTime})`);
  const test67Pass = shiftD.source === 'ROSTER' && shiftD.shift.id === shiftDay10.id && shiftA.source === 'ASSIGNMENT' && shiftA.shift.id === shiftGeneral.id;
  console.log(`Result: ${test67Pass ? '✅ PASS' : '❌ FAIL'}\n`);

  const allPassed = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass && test67Pass;
  console.log('============================================================');
  console.log(`FINAL RESULT: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('============================================================');
  await prisma.$disconnect();
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
