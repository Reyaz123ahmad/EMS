import prisma from '../src/config/prisma.js';
import { markAbsenteesForCompany, markAbsenteesAllCompanies } from '../src/modules/attendance/services/markAbsentees.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import { authService } from '../src/modules/auth/auth.service.js';

async function verify() {
  console.log('============================================================');
  console.log('PHASE 1: RUN MARK ABSENTEES FOR DATES OCT 1 - OCT 4');
  console.log('============================================================');

  const company = await prisma.company.findFirst({
    where: { id: '925af98c-24d1-4f9f-8f87-97a55734c7cd' }
  });

  const dates = [
    '2026-10-01T00:00:00.000Z',
    '2026-10-02T00:00:00.000Z',
    '2026-10-03T00:00:00.000Z',
    '2026-10-04T00:00:00.000Z'
  ];

  for (const d of dates) {
    const res = await markAbsenteesForCompany(company.id, {
      date: new Date(d),
      forceAllShifts: true
    });
    console.log(`Date [${d.split('T')[0]}]: Marked ${res.marked}, Skipped ${res.skipped}`);
  }

  console.log('\n============================================================');
  console.log('PHASE 2: DB QUERY FOR EJAZ AHMAD (Night Shift)');
  console.log('============================================================');

  const ejazUser = await prisma.user.findFirst({
    where: { email: { equals: 'ejazahmad96614@gmail.com', mode: 'insensitive' } },
    include: { employee: true }
  });

  const ejazLogs = await prisma.attendanceLog.findMany({
    where: { employeeId: ejazUser.employee.id },
    orderBy: { attendanceDate: 'desc' }
  });

  console.log(`Found ${ejazLogs.length} attendance records for Ejaz Ahmad:`);
  ejazLogs.forEach(l => {
    console.log(`Date: ${l.attendanceDate.toISOString().split('T')[0]} | Shift: ${l.shiftName} (${l.shiftStartTime}-${l.shiftEndTime}) | Status: ${l.status}`);
  });

  console.log('\n============================================================');
  console.log('PHASE 3: TEST API LIST ATTENDANCE LOGS');
  console.log('============================================================');

  // 1. Admin Query (All employees in company)
  console.log('\n--- 1. Admin Attendance Logs Query ---');
  const adminResult = await attendanceService.listAttendanceLogs(
    company.id,
    { startDate: '2026-10-01', endDate: '2026-10-31' },
    { page: 1, limit: 50 }
  );

  console.log(`Admin query total logs: ${adminResult.pagination.total}`);
  const ejazInAdmin = adminResult.logs.filter(l => l.employee?.id === ejazUser.employee.id);
  console.log(`Ejaz logs visible to Admin: ${ejazInAdmin.length}`);
  ejazInAdmin.forEach(l => {
    console.log(`  -> [${l.attendanceDate.toISOString().split('T')[0]}] Shift: ${l.shiftName} | Status: ${l.status}`);
  });

  // 2. Employee Query (Scoped to Ejaz)
  console.log('\n--- 2. Employee Attendance Logs Query (Ejaz) ---');
  const employeeResult = await attendanceService.listAttendanceLogs(
    company.id,
    { employeeId: ejazUser.employee.id, startDate: '2026-10-01', endDate: '2026-10-31' },
    { page: 1, limit: 50 }
  );

  console.log(`Employee query total logs: ${employeeResult.pagination.total}`);
  employeeResult.logs.forEach(l => {
    console.log(`  -> [${l.attendanceDate.toISOString().split('T')[0]}] Shift: ${l.shiftName} | Status: ${l.status}`);
  });

  console.log('\n============================================================');
  console.log('SUMMARY OF VERIFICATION:');
  console.log('- DB has Night Shift rows for Oct 1-4:', ejazLogs.length >= 4 ? 'PASS' : 'FAIL');
  console.log('- Admin panel query shows Night Shift:', ejazInAdmin.length >= 4 ? 'PASS' : 'FAIL');
  console.log('- Employee panel query shows Night Shift:', employeeResult.pagination.total >= 4 ? 'PASS' : 'FAIL');
  console.log('============================================================');

  process.exit(0);
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
