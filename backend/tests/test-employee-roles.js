import { prisma } from '../src/config/prisma.js';
import employeesService, { checkRoleAssignmentPermission, ROLE_ASSIGNMENT_MATRIX } from '../src/modules/employees/employees.service.js';
import authRepository from '../src/modules/auth/auth.repository.js';
import crypto from 'crypto';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING EMPLOYEE ROLE ASSIGNMENT INTEGRATION TESTS');
  console.log('====================================================\n');

  let testCompany = await prisma.company.findFirst();
  if (!testCompany) {
    testCompany = await prisma.company.create({
      data: {
        name: 'Test Role Company',
        companyCode: `TRC-${Date.now()}`
      }
    });
  }
  const companyId = testCompany.id;

  // Retrieve Roles
  const hrAdminRole = await prisma.role.findFirst({ where: { name: 'HR_ADMIN' } });
  const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
  const employeeRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
  const hrManagerRole = await prisma.role.findFirst({ where: { name: 'HR_MANAGER' } });

  console.log('ROLES LOADED:', {
    HR_ADMIN: hrAdminRole?.id,
    HR_MANAGER: hrManagerRole?.id,
    MANAGER: managerRole?.id,
    EMPLOYEE: employeeRole?.id
  });

  const createdUserIds = [];
  const createdEmployeeIds = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: Create Employee with HR_ADMIN Role (by COMPANY_ADMIN)
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Create employee with HR_ADMIN role (COMPANY_ADMIN) ---');
    const sessionId1 = crypto.randomUUID();
    const testEmail1 = `hradmin.test.${Date.now()}@example.com`;
    const employeeData1 = {
      firstName: 'Jane',
      lastName: 'HRAdmin',
      email: testEmail1,
      phone: '+15551234567',
      employmentType: 'FULL_TIME',
      roleId: hrAdminRole.id
    };

    // Store verified session in Redis
    await authRepository.storeOTP(
      `session:${sessionId1}`,
      JSON.stringify({
        sessionId: sessionId1,
        verified: true,
        employeeData: employeeData1,
        companyId,
        companyName: testCompany.name
      }),
      'EMPLOYEE_CREATE',
      15
    );

    const res1 = await employeesService.createEmployeeWithUser({
      sessionId: sessionId1,
      employeeData: employeeData1,
      companyId,
      createdBy: 'test-admin',
      reqUser: { role: 'COMPANY_ADMIN', companyId }
    });

    createdUserIds.push(res1.user.id);
    createdEmployeeIds.push(res1.employee.id);

    // Verify UserRole in DB
    const userRole1 = await prisma.userRole.findFirst({
      where: { userId: res1.user.id },
      include: { role: true }
    });

    if (userRole1 && userRole1.role.name === 'HR_ADMIN') {
      console.log('✅ TEST 1 PASSED: UserRole successfully created with HR_ADMIN role.');
    } else {
      console.error('❌ TEST 1 FAILED: Expected HR_ADMIN, found:', userRole1?.role?.name);
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 2: HR_MANAGER Permission Matrix Options
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: HR_MANAGER permission matrix check ---');
    const hrManagerCanAssignEmployee = checkRoleAssignmentPermission('HR_MANAGER', 'EMPLOYEE');
    const hrManagerCanAssignHRAdmin = checkRoleAssignmentPermission('HR_MANAGER', 'HR_ADMIN');
    const hrManagerCanAssignManager = checkRoleAssignmentPermission('HR_MANAGER', 'MANAGER');

    if (hrManagerCanAssignEmployee && !hrManagerCanAssignHRAdmin && !hrManagerCanAssignManager) {
      console.log('✅ TEST 2 PASSED: HR_MANAGER can only assign EMPLOYEE (HR_ADMIN and MANAGER blocked).');
    } else {
      console.error('❌ TEST 2 FAILED: HR_MANAGER matrix check failed:', {
        hrManagerCanAssignEmployee,
        hrManagerCanAssignHRAdmin,
        hrManagerCanAssignManager
      });
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 3: Promote existing EMPLOYEE to MANAGER via updateEmployeeRole
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Promote existing employee to MANAGER (PATCH /employees/:id/role) ---');
    const sessionId3 = crypto.randomUUID();
    const testEmail3 = `employee.promote.${Date.now()}@example.com`;
    const employeeData3 = {
      firstName: 'Bob',
      lastName: 'PromoteMe',
      email: testEmail3,
      phone: '+15559876543',
      employmentType: 'FULL_TIME',
      roleId: employeeRole.id
    };

    await authRepository.storeOTP(
      `session:${sessionId3}`,
      JSON.stringify({
        sessionId: sessionId3,
        verified: true,
        employeeData: employeeData3,
        companyId,
        companyName: testCompany.name
      }),
      'EMPLOYEE_CREATE',
      15
    );

    const res3 = await employeesService.createEmployeeWithUser({
      sessionId: sessionId3,
      employeeData: employeeData3,
      companyId,
      createdBy: 'test-admin',
      reqUser: { role: 'COMPANY_ADMIN', companyId }
    });

    createdUserIds.push(res3.user.id);
    createdEmployeeIds.push(res3.employee.id);

    // Initial role verify
    const initialRole = await prisma.userRole.findFirst({
      where: { userId: res3.user.id },
      include: { role: true }
    });
    console.log('Initial role before promotion:', initialRole?.role?.name);

    // Admin promotes Bob to MANAGER
    const updateResult = await employeesService.updateEmployeeRole(
      res3.employee.id,
      { roleId: managerRole.id },
      { role: 'COMPANY_ADMIN', companyId, id: 'admin-user-id' }
    );

    const updatedUserRole = await prisma.userRole.findFirst({
      where: { userId: res3.user.id },
      include: { role: true }
    });

    if (updatedUserRole && updatedUserRole.role.name === 'MANAGER') {
      console.log('✅ TEST 3 PASSED: Employee successfully promoted to MANAGER role.');
    } else {
      console.error('❌ TEST 3 FAILED: Role was not updated to MANAGER:', updatedUserRole?.role?.name);
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 4: Permission Enforcement (MANAGER cannot assign HR_ADMIN)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Permission Enforcement (MANAGER cannot assign HR_ADMIN -> 403) ---');
    let managerForbiddenPassed = false;
    try {
      await employeesService.updateEmployeeRole(
        res3.employee.id,
        { roleId: hrAdminRole.id },
        { role: 'MANAGER', companyId, id: 'manager-user-id' }
      );
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('permission')) {
        managerForbiddenPassed = true;
        console.log('✅ TEST 4 PASSED: Caught expected 403 / Forbidden error:', err.message);
      } else {
        console.error('Unexpected error thrown:', err);
      }
    }

    if (!managerForbiddenPassed) {
      console.error('❌ TEST 4 FAILED: MANAGER was able to assign HR_ADMIN without 403.');
      process.exit(1);
    }

    // -------------------------------------------------------------
    // TEST 5: Backward Compatibility (No roleId provided -> EMPLOYEE)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Backward compatibility (no roleId -> default to EMPLOYEE) ---');
    const sessionId5 = crypto.randomUUID();
    const testEmail5 = `legacy.emp.${Date.now()}@example.com`;
    const employeeData5 = {
      firstName: 'Legacy',
      lastName: 'NoRolePassed',
      email: testEmail5,
      phone: '+15555550000',
      employmentType: 'CONTRACT'
      // roleId and role omitted intentionally
    };

    await authRepository.storeOTP(
      `session:${sessionId5}`,
      JSON.stringify({
        sessionId: sessionId5,
        verified: true,
        employeeData: employeeData5,
        companyId,
        companyName: testCompany.name
      }),
      'EMPLOYEE_CREATE',
      15
    );

    const res5 = await employeesService.createEmployeeWithUser({
      sessionId: sessionId5,
      employeeData: employeeData5,
      companyId,
      createdBy: 'test-admin',
      reqUser: { role: 'COMPANY_ADMIN', companyId }
    });

    createdUserIds.push(res5.user.id);
    createdEmployeeIds.push(res5.employee.id);

    const userRole5 = await prisma.userRole.findFirst({
      where: { userId: res5.user.id },
      include: { role: true }
    });

    if (userRole5 && userRole5.role.name === 'EMPLOYEE') {
      console.log('✅ TEST 5 PASSED: Omission of roleId correctly defaulted to EMPLOYEE.');
    } else {
      console.error('❌ TEST 5 FAILED: Expected EMPLOYEE default, got:', userRole5?.role?.name);
      process.exit(1);
    }

    console.log('\n====================================================');
    console.log('ALL 5 TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } finally {
    // Cleanup created test records
    for (const empId of createdEmployeeIds) {
      await prisma.shiftAssignment.deleteMany({ where: { employeeId: empId } }).catch(() => {});
      await prisma.leaveBalance.deleteMany({ where: { employeeId: empId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { entityId: empId } }).catch(() => {});
      await prisma.employee.delete({ where: { id: empId } }).catch(() => {});
    }
    for (const uId of createdUserIds) {
      await prisma.userRole.deleteMany({ where: { userId: uId } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { userId: uId } }).catch(() => {});
      await prisma.user.delete({ where: { id: uId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
