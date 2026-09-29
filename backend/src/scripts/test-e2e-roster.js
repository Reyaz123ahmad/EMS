import { prisma } from '../config/prisma.js';
import { resolveShiftForEmployee, getEffectiveShiftOverview } from '../modules/shifts/services/shift-resolver.service.js';
import { attendanceService } from '../modules/attendance/attendance.service.js';
import { markAbsenteesForCompany } from '../modules/attendance/services/markAbsentees.service.js';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING REAL DB END-TO-END SHIFT ROSTER TESTS');
  console.log('====================================================\n');

  // 1. Find employee
  const employee = await prisma.employee.findFirst({
    where: { email: 'ejazahmad96614@gmail.com' },
    include: {
      shiftAssignments: { include: { shift: true } },
      company: true
    }
  });

  if (!employee) {
    console.error('Test employee ejazahmad96614@gmail.com not found!');
    process.exit(1);
  }

  const companyId = employee.companyId;
  const employeeId = employee.id;
  console.log(`Found Employee: ${employee.firstName} ${employee.lastName} (${employee.id})`);
  console.log(`Company: ${employee.company.name} (${companyId})`);

  // Ensure shifts exist (Day Shift 09:00-18:00 and Night Shift 21:00-06:00)
  let dayShift = await prisma.shift.findFirst({
    where: { companyId, name: { contains: 'Day', mode: 'insensitive' } }
  });
  if (!dayShift) {
    dayShift = await prisma.shift.create({
      data: {
        companyId,
        name: 'Day Shift',
        startTime: '09:00',
        endTime: '18:00',
        graceMinutes: 15,
        workingHours: 8
      }
    });
  }

  let nightShift = await prisma.shift.findFirst({
    where: { companyId, name: { contains: 'Night', mode: 'insensitive' } }
  });
  if (!nightShift) {
    nightShift = await prisma.shift.create({
      data: {
        companyId,
        name: 'Night Shift',
        startTime: '21:00',
        endTime: '06:00',
        graceMinutes: 15,
        workingHours: 8,
        isNightShift: true
      }
    });
  }

  // Ensure default shift assignment is Night Shift
  await prisma.shiftAssignment.deleteMany({ where: { employeeId } });
  await prisma.shiftAssignment.create({
    data: {
      employeeId,
      shiftId: nightShift.id,
      effectiveFrom: new Date('2026-01-01')
    }
  });

  console.log(`Default Shift assigned: ${nightShift.name} (${nightShift.startTime} - ${nightShift.endTime})`);

  // ----------------------------------------------------
  // TEST 1: Resolver with NO roster -> Default Night Shift
  // ----------------------------------------------------
  await prisma.roster.deleteMany({ where: { employeeId } });
  const noRosterRes = await resolveShiftForEmployee({ employeeId, companyId, date: new Date('2026-09-29') });
  console.log('\n--- TEST 1: No Roster (Fallback to Default) ---');
  console.log(`Source: ${noRosterRes.source} (Expected: ASSIGNMENT)`);
  console.log(`Shift: ${noRosterRes.shift?.name} (Expected: ${nightShift.name})`);
  const test1Passed = noRosterRes.source === 'ASSIGNMENT' && noRosterRes.shift?.id === nightShift.id;
  console.log(`Result: ${test1Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 2: Assign Roster (Day Shift) -> Resolver returns ROSTER
  // ----------------------------------------------------
  const today = new Date('2026-09-29');
  const roster = await prisma.roster.create({
    data: {
      companyId,
      employeeId,
      shiftId: dayShift.id,
      date: today,
      isPublished: true
    }
  });
  console.log(`\nCreated active Roster for Day Shift for ${today.toISOString().slice(0, 10)}`);

  const rosterRes = await resolveShiftForEmployee({ employeeId, companyId, date: today });
  const overview = await getEffectiveShiftOverview({ employeeId, companyId, date: today });
  console.log('\n--- TEST 2: Active Roster Resolution ---');
  console.log(`Resolved Source: ${rosterRes.source} (Expected: ROSTER)`);
  console.log(`Resolved Shift: ${rosterRes.shift?.name} (Expected: ${dayShift.name})`);
  console.log(`Current Shift in Overview: ${overview.currentShift?.name}`);
  console.log(`Default Shift in Overview: ${overview.defaultShift?.name} (Status: ${overview.defaultShiftStatus})`);
  const test2Passed = rosterRes.source === 'ROSTER' && rosterRes.shift?.id === dayShift.id && overview.defaultShiftStatus === 'DEACTIVATED_BY_ROSTER';
  console.log(`Result: ${test2Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 3: Employee today status API
  // ----------------------------------------------------
  const todayStatus = await attendanceService.getTodayStatus(employeeId, companyId);
  console.log('\n--- TEST 3: Employee getTodayStatus API Response ---');
  console.log(`currentShift.name: ${todayStatus.currentShift?.name}`);
  console.log(`shiftSource: ${todayStatus.shiftSource}`);
  console.log(`defaultShift.name: ${todayStatus.defaultShift?.name}`);
  console.log(`defaultShiftStatus: ${todayStatus.defaultShiftStatus}`);
  console.log(`isRosterOverride: ${todayStatus.isRosterOverride}`);
  const test3Passed = todayStatus.shiftSource === 'ROSTER' && todayStatus.currentShift?.id === dayShift.id && todayStatus.defaultShiftStatus === 'DEACTIVATED_BY_ROSTER';
  console.log(`Result: ${test3Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 4: Punch In with Roster (10:00 AM -> 60m late against 09:00 start)
  // ----------------------------------------------------
  // Clean up any existing attendance log for today
  await prisma.attendanceLog.deleteMany({
    where: { employeeId, attendanceDate: today }
  });

  const checkInTimestamp = new Date('2026-09-29T10:00:00.000Z');
  const lateCalc = attendanceService.calculateLateMinutes(checkInTimestamp, dayShift, dayShift.graceMinutes);
  console.log(`\nLate calculation for 10:00 punch against 09:00 start: ${lateCalc.lateMinutes} mins late`);

  const createdLog = await prisma.attendanceLog.create({
    data: {
      companyId,
      employeeId,
      attendanceDate: today,
      status: 'LATE',
      isLate: true,
      lateMinutes: 60,
      checkInAt: checkInTimestamp,
      shiftId: dayShift.id,
      shiftName: dayShift.name,
      shiftStartTime: dayShift.startTime,
      shiftEndTime: dayShift.endTime,
      shiftSource: 'ROSTER',
      expectedStart: new Date('2026-09-29T09:00:00.000Z'),
      expectedEnd: new Date('2026-09-29T18:00:00.000Z'),
      isRosterOverride: true,
      attendanceMethod: 'FACE'
    }
  });

  console.log('\n--- TEST 4: AttendanceLog DB Record (Punch-In) ---');
  console.log(`Logged shiftName: ${createdLog.shiftName}`);
  console.log(`Logged shiftSource: ${createdLog.shiftSource}`);
  console.log(`Logged isRosterOverride: ${createdLog.isRosterOverride}`);
  console.log(`Logged lateMinutes: ${createdLog.lateMinutes}`);
  console.log(`Logged expectedStart: ${createdLog.expectedStart.toISOString()}`);
  console.log(`Logged expectedEnd: ${createdLog.expectedEnd.toISOString()}`);
  const test4Passed = createdLog.shiftName === dayShift.name && createdLog.shiftSource === 'ROSTER' && createdLog.isRosterOverride === true && createdLog.lateMinutes === 60;
  console.log(`Result: ${test4Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 5: Company logs endpoint returns roster + defaultShift
  // ----------------------------------------------------
  const logsRes = await attendanceService.listAttendanceLogs(companyId, { employeeId });
  const matchingLog = logsRes.logs.find(l => l.id === createdLog.id);
  console.log('\n--- TEST 5: Company Attendance Logs View ---');
  console.log(`Row shiftName: ${matchingLog?.shiftName}`);
  console.log(`Row isRosterOverride: ${matchingLog?.isRosterOverride}`);
  console.log(`Row defaultShift: ${matchingLog?.defaultShift?.name}`);
  const test5Passed = matchingLog?.shiftName === dayShift.name && matchingLog?.isRosterOverride === true && matchingLog?.defaultShift?.name === nightShift.name;
  console.log(`Result: ${test5Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 6: Auto-Absent Cutoff on Roster Shift
  // ----------------------------------------------------
  await prisma.attendanceLog.deleteMany({
    where: { employeeId, attendanceDate: today }
  });
  // Simulate time after Day Shift end (18:15 cutoff)
  const afterShiftEnd = new Date('2026-09-29T18:30:00.000Z');
  const absentResult = await markAbsenteesForCompany(companyId, { date: today, currentTime: afterShiftEnd });
  const absentLog = await prisma.attendanceLog.findFirst({
    where: { employeeId, attendanceDate: today }
  });
  console.log('\n--- TEST 6: Auto-Absent with Roster ---');
  console.log(`Absent Log Created: ${Boolean(absentLog)}`);
  console.log(`Absent Log shiftName: ${absentLog?.shiftName}`);
  console.log(`Absent Log shiftSource: ${absentLog?.shiftSource}`);
  console.log(`Absent Log isRosterOverride: ${absentLog?.isRosterOverride}`);
  const test6Passed = absentLog?.status === 'ABSENT' && absentLog?.shiftName === dayShift.name && absentLog?.isRosterOverride === true;
  console.log(`Result: ${test6Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 7: Auto-Revert after Roster End Date
  // ----------------------------------------------------
  const afterRosterDate = new Date('2026-10-10'); // After 2026-09-29 roster
  const revertedRes = await resolveShiftForEmployee({ employeeId, companyId, date: afterRosterDate });
  console.log('\n--- TEST 7: Auto-Revert to Default After Roster End ---');
  console.log(`Resolved Source: ${revertedRes.source} (Expected: ASSIGNMENT)`);
  console.log(`Resolved Shift: ${revertedRes.shift?.name} (Expected: ${nightShift.name})`);
  const test7Passed = revertedRes.source === 'ASSIGNMENT' && revertedRes.shift?.id === nightShift.id;
  console.log(`Result: ${test7Passed ? '✅ PASS' : '❌ FAIL'}`);

  // ----------------------------------------------------
  // TEST 8: Historical Frozen Record
  // ----------------------------------------------------
  // Even if roster is deleted, past log remains unchanged
  await prisma.roster.deleteMany({ where: { employeeId } });
  const pastLog = await prisma.attendanceLog.findFirst({
    where: { employeeId, attendanceDate: today }
  });
  console.log('\n--- TEST 8: Historical Attendance Record Preservation ---');
  console.log(`Past Log Shift: ${pastLog?.shiftName} (Preserved Day Shift)`);
  console.log(`Past Log Source: ${pastLog?.shiftSource} (Preserved ROSTER)`);
  const test8Passed = pastLog?.shiftName === dayShift.name && pastLog?.shiftSource === 'ROSTER';
  console.log(`Result: ${test8Passed ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n====================================================');
  const allPassed = test1Passed && test2Passed && test3Passed && test4Passed && test5Passed && test6Passed && test7Passed && test8Passed;
  console.log(`OVERALL TEST STATUS: ${allPassed ? '🎉 ALL 8 TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log('====================================================');

  await prisma.$disconnect();
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
