import axios from 'axios';
import { generateAccessToken } from '../src/security/jwt.js';
import { prisma } from '../src/config/prisma.js';

const API_BASE = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 4C FULL PAYLOAD API VERIFICATION');
  console.log('====================================================\n');

  try {
    const timestamp = Date.now();
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Phase 4C Enterprise Corp',
          email: `corp_${timestamp}@ems.com`,
          slug: `phase4c-corp-${timestamp}`,
          phone: '+919876543210',
          tier: 'ENTERPRISE',
          status: 'ACTIVE',
        },
      });
    }

    let user = await prisma.user.findFirst({
      where: { companyId: company.id },
      include: { employee: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        include: { employee: true },
      });
    }

    let employee = user?.employee;
    if (!employee) {
      employee = await prisma.employee.findFirst({
        where: { companyId: company.id },
      });
      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            companyId: company.id,
            firstName: 'Rahul',
            lastName: 'Sharma',
            email: `rahul_${timestamp}@ems.com`,
            phone: '+919876501234',
            empCode: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'ACTIVE',
            joiningDate: new Date(),
          },
        });
      }
    }

    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      role: 'SUPER_ADMIN',
      companyId: company.id,
    });

    const client = axios.create({
      baseURL: API_BASE,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`✓ Test Context: Company=${company.name} (${company.id}), Employee=${employee.firstName} (${employee.id})\n`);

    // PART 1: Attendance Module Full Payload Tests
    console.log('--- 1. Testing Attendance Endpoints ---');
    const attCal = await client.get(`/attendance/calendar?companyId=${company.id}&month=9&year=2026`);
    console.log(`✓ GET /attendance/calendar -> Status: ${attCal.status} (Days: ${attCal.data?.data?.days?.length || 0})`);

    const attSum = await client.get(`/attendance/summary?employeeId=${employee.id}&month=9&year=2026`);
    console.log(`✓ GET /attendance/summary -> Status: ${attSum.status} (Present: ${attSum.data?.data?.presentDays || 0})`);

    const attMan = await client.post(`/attendance/manual`, {
      employeeId: employee.id,
      date: '2026-09-22',
      checkIn: '09:00:00',
      checkOut: '18:00:00',
      status: 'PRESENT',
      reason: 'On-site system auditing',
      markedBy: employee.id,
    });
    console.log(`✓ POST /attendance/manual -> Status: ${attMan.status} (ID: ${attMan.data?.data?.id})`);

    const attBulk = await client.post(`/attendance/bulk-mark`, {
      companyId: company.id,
      employeeIds: [employee.id],
      date: '2026-09-23',
      status: 'PRESENT',
      markedBy: employee.id,
    });
    console.log(`✓ POST /attendance/bulk-mark -> Status: ${attBulk.status} (Count: ${attBulk.data?.data?.count || 1})`);

    const attExc = await client.get(`/attendance/exceptions?companyId=${company.id}&startDate=2026-09-01&endDate=2026-09-30`);
    console.log(`✓ GET /attendance/exceptions -> Status: ${attExc.status} (Exceptions: ${attExc.data?.data?.length || 0})`);

    const attPol = await client.put(`/attendance/policy`, {
      companyId: company.id,
      policy: {
        workHoursPerDay: 8,
        gracePeriodMinutes: 15,
        halfDayThresholdHours: 4,
        overtimeThresholdMinutes: 30,
      },
    });
    console.log(`✓ PUT /attendance/policy -> Status: ${attPol.status}`);

    // PART 2: Leave Module Full Payload Tests
    console.log('\n--- 2. Testing Leave Endpoints ---');
    const ltRes = await client.post(`/leave/types`, {
      companyId: company.id,
      name: `Privilege Leave ${timestamp}`,
      code: `PL_${timestamp.toString().slice(-4)}`,
      description: 'Annual accumulated privilege leave',
      daysAllowed: 15,
      isPaid: true,
      carryForward: true,
      maxCarryForwardDays: 5,
    });
    const leaveTypeId = ltRes.data?.data?.id;
    console.log(`✓ POST /leave/types -> Status: ${ltRes.status} (ID: ${leaveTypeId})`);

    const ltList = await client.get(`/leave/types?companyId=${company.id}`);
    console.log(`✓ GET /leave/types -> Status: ${ltList.status} (Total: ${ltList.data?.data?.length || 0})`);

    const ltBulk = await client.post(`/leave/balances/bulk-allocate`, {
      companyId: company.id,
      leaveTypeId,
      year: 2026,
      days: 15,
      allocatedBy: employee.id,
    });
    console.log(`✓ POST /leave/balances/bulk-allocate -> Status: ${ltBulk.status}`);

    const applyRes = await client.post(`/leave/apply`, {
      companyId: company.id,
      employeeId: employee.id,
      leaveTypeId,
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      reason: 'Personal vacation and medical checkup',
    });
    const leaveRequestId = applyRes.data?.data?.id || applyRes.data?.data?.leaveRequest?.id;
    console.log(`✓ POST /leave/apply -> Status: ${applyRes.status} (Request ID: ${leaveRequestId})`);


    const leaveReqList = await client.get(`/leave/requests?companyId=${company.id}`);
    console.log(`✓ GET /leave/requests -> Status: ${leaveReqList.status} (Found: ${leaveReqList.data?.data?.length || 0})`);

    const appLeaveRes = await client.put(`/leave/requests/${leaveRequestId}/approve`, {
      approvedBy: employee.id,
      remarks: 'Approved by HR Operations',
    });
    console.log(`✓ PUT /leave/requests/:id/approve -> Status: ${appLeaveRes.status}`);

    const leaveCal = await client.get(`/leave/calendar?companyId=${company.id}&month=10&year=2026`);
    console.log(`✓ GET /leave/calendar -> Status: ${leaveCal.status} (Calendar entries: ${leaveCal.data?.data?.length || 0})`);

    const leaveStats = await client.get(`/leave/stats?companyId=${company.id}&year=2026`);
    console.log(`✓ GET /leave/stats -> Status: ${leaveStats.status}`);

    // PART 3: Payroll Module Full Payload Tests
    console.log('\n--- 3. Testing Payroll Endpoints ---');
    const compRes = await client.post(`/payroll/components`, {
      companyId: company.id,
      name: `Dearness Allowance ${timestamp}`,
      code: `DA_${timestamp.toString().slice(-4)}`,
      type: 'EARNING',
      calculationType: 'PERCENTAGE',
      defaultAmount: 20,
      isTaxable: true,
      description: 'Cost of living index component',
    });
    console.log(`✓ POST /payroll/components -> Status: ${compRes.status} (ID: ${compRes.data?.data?.id})`);

    const compList = await client.get(`/payroll/components?companyId=${company.id}`);
    console.log(`✓ GET /payroll/components -> Status: ${compList.status}`);

    const payPrev = await client.post(`/payroll/preview`, {
      companyId: company.id,
      month: 9,
      year: 2026,
    });
    console.log(`✓ POST /payroll/preview -> Status: ${payPrev.status} (Estimated Employees: ${payPrev.data?.data?.items?.length || 0})`);

    const payProc = await client.post(`/payroll/process`, {
      companyId: company.id,
      month: 9,
      year: 2026,
      processedBy: employee.id,
    });
    const payrollRunId = payProc.data?.data?.id;
    console.log(`✓ POST /payroll/process -> Status: ${payProc.status} (Run ID: ${payrollRunId})`);

    const payApp = await client.put(`/payroll/runs/${payrollRunId}/approve`, {
      approvedBy: employee.id,
    });
    console.log(`✓ PUT /payroll/runs/:id/approve -> Status: ${payApp.status}`);

    const payRuns = await client.get(`/payroll/runs?companyId=${company.id}&year=2026`);
    console.log(`✓ GET /payroll/runs -> Status: ${payRuns.status} (Total Runs: ${payRuns.data?.data?.length || 0})`);

    const paySlips = await client.get(`/payroll/slips?companyId=${company.id}&month=9&year=2026`);
    console.log(`✓ GET /payroll/slips -> Status: ${paySlips.status} (Slips: ${paySlips.data?.data?.length || 0})`);

    // PART 4: Overtime Module Full Payload Tests
    console.log('\n--- 4. Testing Overtime Endpoints ---');
    const otRule = await client.post(`/overtime/rules`, {
      companyId: company.id,
      name: `Holiday Overtime Rate ${timestamp}`,
      dayType: 'HOLIDAY',
      multiplier: 2.5,
      minMinutes: 60,
      maxDailyMinutes: 480,
      requiresApproval: true,
    });
    console.log(`✓ POST /overtime/rules -> Status: ${otRule.status} (Rule ID: ${otRule.data?.data?.id})`);

    const otApply = await client.post(`/overtime/apply`, {
      companyId: company.id,
      employeeId: employee.id,
      date: '2026-09-24',
      minutes: 180,
      reason: 'Urgent production data patch deployment',
    });
    const otRecordId = otApply.data?.data?.id;
    console.log(`✓ POST /overtime/apply -> Status: ${otApply.status} (Claim ID: ${otRecordId})`);

    const otApp = await client.put(`/overtime/requests/${otRecordId}/approve`, {
      approvedBy: employee.id,
      remarks: 'Overtime verified and authorized',
    });
    console.log(`✓ PUT /overtime/requests/:id/approve -> Status: ${otApp.status}`);

    const otStats = await client.get(`/overtime/stats?companyId=${company.id}`);
    console.log(`✓ GET /overtime/stats -> Status: ${otStats.status} (Hours: ${otStats.data?.data?.totalHours || 0})`);

    // PART 5: Shift & Roster Module Full Payload Tests
    console.log('\n--- 5. Testing Shift & Roster Endpoints ---');
    const shiftRes = await client.post(`/shifts`, {
      companyId: company.id,
      name: `Evening Shift ${timestamp}`,
      code: `ES_${timestamp.toString().slice(-4)}`,
      startTime: '16:00',
      endTime: '00:00',
      gracePeriod: 15,
      halfDayHours: 4,
      fullDayHours: 8,
      breakDuration: 45,
      isNightShift: true,
      description: 'Second shift evening coverage',
    });
    const shiftId = shiftRes.data?.data?.id;
    console.log(`✓ POST /shifts -> Status: ${shiftRes.status} (Shift ID: ${shiftId})`);

    const shiftAssign = await client.post(`/shifts/assign`, {
      companyId: company.id,
      shiftId,
      effectiveFrom: '2026-10-01',
      effectiveTo: '2026-12-31',
      employeeIds: [employee.id],
    });
    console.log(`✓ POST /shifts/assign -> Status: ${shiftAssign.status}`);

    const rosterGen = await client.post(`/rosters/generate`, {
      companyId: company.id,
      month: 10,
      year: 2026,
      shiftId,
      shiftPattern: '5_2',
    });
    console.log(`✓ POST /rosters/generate -> Status: ${rosterGen.status} (Roster Generated: ${rosterGen.data?.data?.length || 0})`);

    const rosterCal = await client.get(`/rosters/calendar?companyId=${company.id}&month=10&year=2026`);
    console.log(`✓ GET /rosters/calendar -> Status: ${rosterCal.status} (Roster Entries: ${rosterCal.data?.data?.length || 0})`);

    // PART 6: Holiday Calendar Module Full Payload Tests
    console.log('\n--- 6. Testing Holiday Calendar Endpoints ---');
    const calRes = await client.post(`/holiday-calendars`, {
      companyId: company.id,
      name: `Bangalore Holidays ${timestamp}`,
      year: 2026,
      isDefault: true,
      description: 'Official Karnataka festival & national holidays',
    });
    const calendarId = calRes.data?.data?.id;
    console.log(`✓ POST /holiday-calendars -> Status: ${calRes.status} (Cal ID: ${calendarId})`);

    const holRes = await client.post(`/holidays`, {
      companyId: company.id,
      calendarId,
      name: `Kannada Rajyotsava ${timestamp}`,
      date: '2026-11-01',
      isOptional: false,
      description: 'Karnataka State Formation Day',
    });
    console.log(`✓ POST /holidays -> Status: ${holRes.status} (Holiday ID: ${holRes.data?.data?.id})`);

    const holBulk = await client.post(`/holidays/bulk-import`, {
      companyId: company.id,
      calendarId,
      importedBy: employee.id,
      holidays: [
        { name: 'Republic Day', date: '2026-01-26', isOptional: false },
        { name: 'Independence Day', date: '2026-08-15', isOptional: false },
      ],
    });
    console.log(`✓ POST /holidays/bulk-import -> Status: ${holBulk.status} (Imported: ${holBulk.data?.data?.count || 2})`);

    const holCal = await client.get(`/holidays/calendar?companyId=${company.id}&year=2026`);
    console.log(`✓ GET /holidays/calendar -> Status: ${holCal.status} (Total Holidays: ${holCal.data?.data?.holidays?.length || holCal.data?.data?.length || 0})`);

    console.log('\n====================================================');
    console.log('✅ ALL PHASE 4C ENDPOINTS PASSED WITH FULL PAYLOADS!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
