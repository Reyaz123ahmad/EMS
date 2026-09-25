import bcrypt from 'bcryptjs';
import prisma from '../src/config/prisma.js';

async function seedAuditData() {
  console.log('--- SEEDING AUDIT USERS AND DATA ---');
  const passwordHash = await bcrypt.hash('Test@123456', 10);
  const superAdminPasswordHash = await bcrypt.hash('Reyaz123@_Ahmad', 10);

  // 1. Ensure Roles Exist
  const roleNames = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE', 'CLIENT'];
  const roles = {};
  for (const name of roleNames) {
    let r = await prisma.role.findFirst({ where: { name } });
    if (!r) {
      r = await prisma.role.create({
        data: {
          name,
          displayName: name.replace('_', ' '),
          description: `${name} system role`,
          isSystem: true
        }
      });
    }
    roles[name] = r;
  }

  // 2. Ensure Test Plan & Company
  let plan = await prisma.subscriptionPlan.findFirst();
  if (!plan) {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise Pro',
        price: 9999,
        billingCycle: 'monthly',
        maxEmployees: 500,
        features: { attendance: true, payroll: true, leave: true, projects: true },
        isActive: true
      }
    });
  }

  let company = await prisma.company.findFirst({
    where: { name: 'Mindstocs Test Company' }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Mindstocs Test Company',
        companyCode: 'MINDSTOCS',
        email: 'info@mindstocs.com',
        phone: '+91 9876543210',
        status: 'ACTIVE',
        generalSettings: {
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          fiscalYearStart: 4
        }
      }
    });
  }

  // Ensure Subscription
  let subscription = await prisma.subscription.findUnique({
    where: { companyId: company.id }
  });
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        companyId: company.id,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true
      }
    });
  }

  // Ensure Branch, Dept, Designation
  let branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Headquarters',
        branchCode: 'HQ-01',
        city: 'Mumbai',
        country: 'India'
      }
    });
  }

  let dept = await prisma.department.findFirst({ where: { companyId: company.id } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        companyId: company.id,
        name: 'Engineering',
        departmentCode: 'ENG'
      }
    });
  }

  let desig = await prisma.designation.findFirst({ where: { companyId: company.id } });
  if (!desig) {
    desig = await prisma.designation.create({
      data: {
        companyId: company.id,
        name: 'Senior Developer',
        designationCode: 'SR_DEV',
        level: 3
      }
    });
  }

  // 3. Create or update the 7 users
  const usersToSeed = [
    {
      email: 'reyazahmadmath@gmail.com',
      passwordHash: superAdminPasswordHash,
      role: 'SUPER_ADMIN',
      firstName: 'Reyaz',
      lastName: 'Ahmad',
      companyId: null,
      phone: '+91 9999999999'
    },
    {
      email: 'admin@mindstocs.com',
      passwordHash,
      role: 'COMPANY_ADMIN',
      firstName: 'Company',
      lastName: 'Admin',
      companyId: company.id,
      phone: '+91 9888888881'
    },
    {
      email: 'hr.admin@mindstocs.com',
      passwordHash,
      role: 'HR_ADMIN',
      firstName: 'HR',
      lastName: 'Admin',
      companyId: company.id,
      phone: '+91 9888888882'
    },
    {
      email: 'hr.manager@mindstocs.com',
      passwordHash,
      role: 'HR_MANAGER',
      firstName: 'HR',
      lastName: 'Manager',
      companyId: company.id,
      phone: '+91 9888888883'
    },
    {
      email: 'manager@mindstocs.com',
      passwordHash,
      role: 'MANAGER',
      firstName: 'Project',
      lastName: 'Manager',
      companyId: company.id,
      phone: '+91 9888888884'
    },
    {
      email: 'employee@mindstocs.com',
      passwordHash,
      role: 'EMPLOYEE',
      firstName: 'John',
      lastName: 'Employee',
      companyId: company.id,
      phone: '+91 9888888885'
    },
    {
      email: 'client@mindstocs.com',
      passwordHash,
      role: 'CLIENT',
      firstName: 'Client',
      lastName: 'Partner',
      companyId: company.id,
      phone: '+91 9888888886'
    }
  ];

  for (const u of usersToSeed) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: u.passwordHash,
          companyId: u.companyId,
          phone: u.phone,
          status: 'ACTIVE'
        }
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: u.passwordHash,
          companyId: u.companyId,
          phone: u.phone,
          status: 'ACTIVE'
        }
      });
      console.log(`Updated user: ${u.email} (${u.role})`);
    }

    // Attach UserRole
    const targetRole = roles[u.role];
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: targetRole.id }
    });
    if (!existingUserRole) {
      // Clear old roles and set target role
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: targetRole.id
        }
      });
    }

    // Create Employee record if role is an internal employee
    if (['COMPANY_ADMIN', 'HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'].includes(u.role)) {
      let emp = await prisma.employee.findUnique({ where: { userId: user.id } });
      if (!emp) {
        const empCode = 'EMP-' + u.role.substring(0, 3) + '-' + Math.floor(100 + Math.random() * 900);
        await prisma.employee.create({
          data: {
            userId: user.id,
            companyId: company.id,
            branchId: branch.id,
            departmentId: dept.id,
            designationId: desig.id,
            employeeCode: empCode,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            phone: u.phone,
            joiningDate: new Date(),
            status: 'ACTIVE',
            employmentType: 'FULL_TIME'
          }
        });
      }
    }
  }

  // Ensure test client record for client@mindstocs.com
  let clientUser = await prisma.user.findUnique({ where: { email: 'client@mindstocs.com' } });
  if (clientUser) {
    let clientRecord = await prisma.client.findFirst({ where: { companyId: company.id } });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: {
          companyId: company.id,
          userId: clientUser.id,
          name: 'Mindstocs Client Partner',
          companyName: 'Client Partner Ltd',
          email: 'client@mindstocs.com',
          phone: '+91 9888888886',
          isActive: true
        }
      });
    }
  }

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

seedAuditData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
