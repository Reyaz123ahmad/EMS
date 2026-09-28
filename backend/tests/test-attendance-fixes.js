import axios from 'axios';
import { prisma } from '../src/config/prisma.js';

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

async function testAttendanceFixes() {
  console.log('Testing Attendance Fixes...');

  // 1. Find Company Admin in DB or test directly with Prisma and API
  const adminUser = await prisma.user.findFirst({
    where: { email: 'reyazahmad40544@gmail.com' },
    include: { company: true }
  });

  if (!adminUser) {
    console.error('Admin user not found in database');
  } else {
    console.log('Admin User found:', adminUser.email, 'Company:', adminUser.company?.name);
  }

  // Check attendance logs for this company
  const logsCount = await prisma.attendanceLog.count({
    where: { companyId: adminUser?.companyId }
  });
  console.log('Total Attendance Logs for Company in DB:', logsCount);

  // If logsCount is 0, let's check if there are attendance logs in general
  const allLogsCount = await prisma.attendanceLog.count();
  console.log('Total Attendance Logs across DB:', allLogsCount);

  // Directly test AttendanceService
  const { attendanceService } = await import('../src/modules/attendance/attendance.service.js');
  
  const companyId = adminUser?.companyId || (await prisma.company.findFirst())?.id;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  console.log('\n--- 1. Testing getMonthlySummary ---');
  const summary = await attendanceService.getMonthlySummary({
    companyId,
    month: currentMonth,
    year: currentYear,
    role: 'COMPANY_ADMIN'
  });
  console.log('Monthly Summary Result:', {
    month: summary.month,
    year: summary.year,
    presentDays: summary.presentDays,
    stats: summary.stats,
    logsLength: summary.logs?.length
  });

  console.log('\n--- 2. Testing getAttendanceExceptions ---');
  const exceptions = await attendanceService.getAttendanceExceptions(companyId);
  console.log('Exceptions Result Total:', exceptions.total, 'Count:', exceptions.exceptions?.length);

  console.log('\n--- 3. Testing getOvertimeTracker ---');
  const overtime = await attendanceService.getOvertimeTracker({ companyId, role: 'COMPANY_ADMIN' });
  console.log('Overtime Result:', overtime);

  console.log('\n--- 4. Testing getShiftRoster ---');
  const shiftRoster = await attendanceService.getShiftRoster({ companyId, role: 'COMPANY_ADMIN' });
  console.log('Shift Roster Result:', { totalShifts: shiftRoster.totalShifts, totalRosters: shiftRoster.totalRosters });

  console.log('\n--- 5. Testing listFraudSignals ---');
  const fraudSignals = await attendanceService.listFraudSignals(companyId, {});
  console.log('Fraud Signals Result:', fraudSignals);

  console.log('\n--- 6. Testing getQrScanner ---');
  const qrScanner = await attendanceService.getQrScanner({ companyId });
  console.log('QR Scanner Result:', qrScanner);

  console.log('\n--- 7. Testing getLiveLocation ---');
  const liveLocation = await attendanceService.getLiveLocation({ companyId });
  console.log('Live Location Result:', liveLocation);

  console.log('\nALL ATTENDANCE SERVICE TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testAttendanceFixes().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
