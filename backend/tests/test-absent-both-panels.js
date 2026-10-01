import prisma from '../src/config/prisma.js';
import { markAbsenteesForCompany } from '../src/modules/attendance/services/markAbsentees.service.js';
import attendanceService from '../src/modules/attendance/attendance.service.js';

async function runVerification() {
  console.log('--- STARTING ABSENT MARKING & BOTH PANELS VERIFICATION ---');

  // 1. Find Ejaz Ahmad & company
  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { email: { contains: 'ejaz', mode: 'insensitive' } },
        { firstName: { contains: 'ejaz', mode: 'insensitive' } }
      ]
    },
    include: { company: true }
  });

  if (!employee) {
    console.error('Test employee Ejaz Ahmad not found!');
    process.exit(1);
  }

  const companyId = employee.companyId;
  const employeeId = employee.id;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  console.log(`Found Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeCode}), Company ID: ${companyId}`);

  // Clean up any existing attendance log for today for a fresh test
  await prisma.attendanceLog.deleteMany({
    where: {
      employeeId,
      attendanceDate: today
    }
  });
  console.log('Cleaned up today\'s attendance log for employee for clean test state.');

  // TEST 1: Auto-absent creates row (simulating past grace cutoff, e.g. 11:00 AM)
  const simulatedTime = new Date();
  simulatedTime.setHours(11, 0, 0, 0);

  const markResult1 = await markAbsenteesForCompany(companyId, {
    date: today,
    currentTime: simulatedTime
  });
  console.log('TEST 1 - markAbsentees Result:', markResult1);

  // Check DB
  const dbRow = await prisma.attendanceLog.findFirst({
    where: {
      employeeId,
      attendanceDate: today
    }
  });

  console.log('TEST 1 DB Row:', dbRow ? {
    id: dbRow.id,
    status: dbRow.status,
    shiftName: dbRow.shiftName,
    attendanceDate: dbRow.attendanceDate
  } : null);

  if (!dbRow || dbRow.status !== 'ABSENT') {
    throw new Error('TEST 1 FAILED: Expected row with status ABSENT not found in DB!');
  }
  console.log('TEST 1 PASSED: ABSENT row successfully created in DB.');

  // TEST 2: Employee panel scoping (GET logs with employeeId filter)
  const employeeLogs = await attendanceService.listAttendanceLogs(companyId, { employeeId }, { page: 1, limit: 10 });
  console.log(`TEST 2 - Employee Panel Logs count: ${employeeLogs.logs.length}`);
  const employeeTodayRow = employeeLogs.logs.find(l => new Date(l.attendanceDate).toISOString().split('T')[0] === today.toISOString().split('T')[0]);
  console.log('TEST 2 - Employee Today Row:', employeeTodayRow ? { status: employeeTodayRow.status, shiftName: employeeTodayRow.shiftName } : null);

  if (!employeeTodayRow || employeeTodayRow.status !== 'ABSENT') {
    throw new Error('TEST 2 FAILED: Employee panel did not find today\'s ABSENT row!');
  }
  console.log('TEST 2 PASSED: Employee panel shows today\'s ABSENT row.');

  // TEST 3: Company panel scoping (GET logs without employeeId filter - shows all employees)
  const companyLogs = await attendanceService.listAttendanceLogs(companyId, {}, { page: 1, limit: 50 });
  console.log(`TEST 3 - Company Panel Logs count: ${companyLogs.logs.length}`);
  const companyEjazRow = companyLogs.logs.find(l => l.employeeId === employeeId && new Date(l.attendanceDate).toISOString().split('T')[0] === today.toISOString().split('T')[0]);
  console.log('TEST 3 - Company Panel found Ejaz row:', companyEjazRow ? { status: companyEjazRow.status, employeeName: `${companyEjazRow.employee?.firstName} ${companyEjazRow.employee?.lastName}` } : null);

  if (!companyEjazRow || companyEjazRow.status !== 'ABSENT') {
    throw new Error('TEST 3 FAILED: Company panel did not find Ejaz\'s ABSENT row!');
  }
  console.log('TEST 3 PASSED: Company panel shows Ejaz\'s ABSENT row alongside other employees.');

  // TEST 4: Monthly summary reflects absent days
  const summary = await attendanceService.getMonthlySummary({
    companyId,
    employeeId,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    role: 'EMPLOYEE'
  });
  console.log('TEST 4 - Monthly Summary:', {
    presentDays: summary.presentDays,
    absentDays: summary.absentDays,
    totalLogs: summary.totalLogs
  });

  if (summary.absentDays < 1) {
    throw new Error('TEST 4 FAILED: Monthly summary did not reflect absent days!');
  }
  console.log('TEST 4 PASSED: Monthly summary reflects absent days.');

  // TEST 5: Idempotency (running markAbsentees again should not create duplicate rows)
  const markResult2 = await markAbsenteesForCompany(companyId, {
    date: today,
    currentTime: simulatedTime
  });
  console.log('TEST 5 - Second markAbsentees run (idempotency):', markResult2);

  const duplicateCheck = await prisma.attendanceLog.findMany({
    where: {
      employeeId,
      attendanceDate: today
    }
  });
  if (duplicateCheck.length !== 1) {
    throw new Error(`TEST 5 FAILED: Expected exactly 1 row, found ${duplicateCheck.length}`);
  }
  console.log('TEST 5 PASSED: Idempotency verified. Exactly 1 row exists.');

  // TEST 6: Leave safety (Simulate employee on approved leave)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let leaveType = await prisma.leaveType.findFirst({ where: { companyId } });
  if (!leaveType) {
    leaveType = await prisma.leaveType.create({
      data: {
        companyId,
        name: 'Sick Leave Test',
        code: 'SLT',
        maxDaysPerYear: 12,
        isPaid: true
      }
    });
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      employeeId,
      leaveTypeId: leaveType.id,
      startDate: tomorrow,
      endDate: tomorrow,
      reason: 'Sick Leave Test',
      status: 'APPROVED',
      totalDays: 1
    }
  });

  const leaveMarkResult = await markAbsenteesForCompany(companyId, {
    date: tomorrow,
    currentTime: simulatedTime
  });
  console.log('TEST 6 - Leave Safety Result:', leaveMarkResult);
  const leaveDetail = leaveMarkResult.details.find(d => d.employeeId === employeeId);
  console.log('TEST 6 - Employee detail:', leaveDetail);

  // Clean up test leave
  await prisma.leaveRequest.delete({ where: { id: leave.id } });

  if (!leaveDetail || leaveDetail.action !== 'SKIPPED' || leaveDetail.reason !== 'ON_APPROVED_LEAVE') {
    throw new Error('TEST 6 FAILED: Employee on approved leave was not skipped!');
  }
  console.log('TEST 6 PASSED: Employee on approved leave safely skipped with ON_APPROVED_LEAVE.');

  console.log('============================================================');
  console.log('ALL 6 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('============================================================');

  await prisma.$disconnect();
  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
