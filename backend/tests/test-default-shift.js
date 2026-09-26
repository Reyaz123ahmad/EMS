import { PrismaClient } from '@prisma/client';
import authRepository from '../src/modules/auth/auth.repository.js';
import companiesService from '../src/modules/companies/companies.service.js';
import shiftsService from '../src/modules/shifts/shifts.service.js';
import employeesService from '../src/modules/employees/employees.service.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('=== STARTING DEFAULT SHIFT INTEGRATION TESTS ===');
  let testPassCount = 0;
  let totalTests = 5;

  const timestamp = Date.now();
  const testCompanyCode = `ST${timestamp.toString().slice(-6)}`;
  const adminEmail = `admin_${timestamp}@shifttest.com`;
  const employeeEmail = `emp_${timestamp}@shifttest.com`;
  const companySessionId = `comp-session-${timestamp}`;
  const employeeSessionId = `emp-session-${timestamp}`;

  let companyId = null;

  try {
    // 1. TEST: Super Admin creates company + Company Admin -> Default shift, Break rules, Leave Types, Weekly off, and Shift Assignment created
    console.log('\n[1/5] Testing Company Creation with Default Shift & Rules...');
    
    // Find or create a plan
    let plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Starter Test Plan',
          maxEmployees: 50,
          pricePerMonth: 0,
          features: ['ATTENDANCE', 'LEAVES', 'SHIFTS'],
          isActive: true
        }
      });
    }

    // Seed verified OTP session in Redis
    await authRepository.storeOTP(
      `session:${companySessionId}`,
      JSON.stringify({
        sessionId: companySessionId,
        verified: true,
        companyData: {
          name: `Shift Test Co ${testCompanyCode}`,
          email: `company_${testCompanyCode}@shifttest.com`
        },
        adminData: {
          email: adminEmail
        },
        planId: plan.id
      }),
      'COMPANY_ADMIN_CREATE',
      30
    );

    const companyCreationResult = await companiesService.createCompanyWithAdmin({
      sessionId: companySessionId,
      companyData: {
        name: `Shift Test Co ${testCompanyCode}`,
        email: `company_${testCompanyCode}@shifttest.com`,
        phone: '+919876543210',
        industry: 'IT',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001'
      },
      adminData: {
        firstName: 'Shift',
        lastName: 'Admin',
        email: adminEmail,
        phone: '+919876543211',
        password: 'Password@123'
      },
      planId: plan.id
    });

    companyId = companyCreationResult.company.id;
    const adminUser = companyCreationResult.admin;
    const adminEmployee = companyCreationResult.employee;

    // Verify Default Shift Created
    const defaultShift = await prisma.shift.findFirst({
      where: { companyId, name: 'General Shift' }
    });

    // Verify Break Rules Created
    const breakRules = await prisma.breakRule.findMany({
      where: { companyId }
    });

    // Verify Leave Types Created
    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId }
    });

    // Verify Weekly Off Rule Created
    const weeklyOff = await prisma.weeklyOffRule.findFirst({
      where: { companyId }
    });

    if (defaultShift && defaultShift.startTime === '09:00' && defaultShift.endTime === '18:00' && breakRules.length >= 2 && leaveTypes.length >= 3 && weeklyOff) {
      console.log('✓ PASS: Default shift (General Shift 09:00 - 18:00), break rules, leave types, and weekly off rules created successfully.');
      testPassCount++;
    } else {
      console.error('✗ FAIL: Default shift or rules creation failed.', { defaultShift, breakRulesCount: breakRules.length, leaveTypesCount: leaveTypes.length, weeklyOff });
    }

    // 2. TEST: Company Admin has shift assigned & getMyShift retrieves it
    console.log('\n[2/5] Testing Company Admin Shift Assignment & Retrieval...');
    const adminAssignment = await prisma.shiftAssignment.findFirst({
      where: { employeeId: adminEmployee.id },
      include: { shift: true }
    });

    const adminMyShift = await shiftsService.getMyShift({
      userId: adminUser.id,
      companyId: companyId,
      email: adminEmail
    });

    if (adminAssignment && adminAssignment.shiftId === defaultShift.id && adminMyShift?.shift?.id === defaultShift.id) {
      console.log(`✓ PASS: Company Admin auto-assigned to ${adminMyShift.shift.name} (${adminMyShift.shift.startTime} - ${adminMyShift.shift.endTime}).`);
      testPassCount++;
    } else {
      console.error('✗ FAIL: Company Admin shift assignment retrieval failed.', { adminAssignment, adminMyShift });
    }

    // 3. TEST: Company Admin can create a new shift (e.g. Night Shift)
    console.log('\n[3/5] Testing Shift Creation by Company Admin...');
    const newShift = await shiftsService.createShift({
      companyId: companyId,
      name: 'Night Shift',
      startTime: '20:00',
      endTime: '05:00',
      graceMinutes: 10,
      workingHours: 8,
      isNightShift: true
    });

    if (newShift && newShift.name === 'Night Shift' && newShift.isNightShift === true) {
      console.log(`✓ PASS: New shift created successfully: ${newShift.name} (ID: ${newShift.id}).`);
      testPassCount++;
    } else {
      console.error('✗ FAIL: Shift creation failed.', newShift);
    }

    // 4. TEST: Employee created with custom shift assignment
    console.log('\n[4/5] Testing Employee Onboarding with Shift Assignment...');
    
    // Create department and designation
    let dept = await prisma.department.findFirst({ where: { companyId } });
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'Engineering', companyId }
      });
    }
    let desig = await prisma.designation.findFirst({ where: { companyId } });
    if (!desig) {
      desig = await prisma.designation.create({
        data: { name: 'Software Engineer', companyId }
      });
    }

    const employeeData = {
      firstName: 'John',
      lastName: 'Developer',
      email: employeeEmail,
      phone: '+919876543212',
      password: 'Password@123',
      departmentId: dept.id,
      designationId: desig.id,
      joiningDate: new Date(),
      role: 'EMPLOYEE',
      shiftId: newShift.id
    };

    // Store verified session in Redis for employee onboarding
    await authRepository.storeOTP(
      `session:${employeeSessionId}`,
      JSON.stringify({
        sessionId: employeeSessionId,
        verified: true,
        employeeData,
        companyId
      }),
      'EMPLOYEE_CREATE',
      15
    );

    const createdEmployeeResult = await employeesService.createEmployeeWithUser({
      sessionId: employeeSessionId,
      employeeData,
      companyId: companyId,
      createdBy: adminUser.id
    });

    const empAssignment = await prisma.shiftAssignment.findFirst({
      where: { employeeId: createdEmployeeResult.employee.id },
      include: { shift: true }
    });

    if (empAssignment && empAssignment.shiftId === newShift.id) {
      console.log(`✓ PASS: Employee onboarded with assigned shift: ${empAssignment.shift.name}.`);
      testPassCount++;
    } else {
      console.error('✗ FAIL: Employee shift assignment failed.', { empAssignment, expectedShiftId: newShift.id });
    }

    // 5. TEST: All roles can retrieve their shift via getMyShift
    console.log('\n[5/5] Testing Shift Retrieval for Employee Role...');
    const employeeMyShift = await shiftsService.getMyShift({
      userId: createdEmployeeResult.user.id,
      companyId: companyId,
      email: employeeEmail
    });

    if (employeeMyShift?.shift?.id === newShift.id && employeeMyShift.shift.name === 'Night Shift') {
      console.log(`✓ PASS: Employee retrieved their shift successfully: ${employeeMyShift.shift.name}.`);
      testPassCount++;
    } else {
      console.error('✗ FAIL: Employee getMyShift failed.', employeeMyShift);
    }

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${testPassCount}/${totalTests} TESTS PASSED`);
    console.log(`========================================`);

    // Cleanup test data
    console.log('\nCleaning up test data...');
    if (companyId) {
      await prisma.shiftAssignment.deleteMany({ where: { shift: { companyId } } });
      await prisma.shiftBreakRule.deleteMany({ where: { shift: { companyId } } });
      await prisma.shift.deleteMany({ where: { companyId } });
      await prisma.breakRule.deleteMany({ where: { companyId } });
      await prisma.leaveBalance.deleteMany({ where: { employee: { companyId } } });
      await prisma.leaveType.deleteMany({ where: { companyId } });
      await prisma.weeklyOffRule.deleteMany({ where: { companyId } });
      await prisma.auditLog.deleteMany({ where: { entityId: companyId } });
      await prisma.employee.deleteMany({ where: { companyId } });
      await prisma.user.deleteMany({ where: { email: { in: [adminEmail, employeeEmail] } } });
      await prisma.designation.deleteMany({ where: { companyId } });
      await prisma.department.deleteMany({ where: { companyId } });
      await prisma.subscription.deleteMany({ where: { companyId } });
      await prisma.company.delete({ where: { id: companyId } });
    }
    console.log('✓ Cleanup complete.');

  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
