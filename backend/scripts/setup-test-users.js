import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

async function main() {
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';
  console.log('Connecting with DB URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  console.log('Target Company:', { id: company?.id, name: company?.name });

  let branch = await prisma.branch.findFirst({ where: { companyId } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        companyId,
        name: 'Headquarters',
        code: 'HQ',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        address: '100 Tech Blvd',
        timezone: 'Asia/Kolkata',
        isActive: true
      }
    });
  }
  console.log('Branch ready:', branch.name);

  let department = await prisma.department.findFirst({ where: { companyId } });
  if (!department) {
    department = await prisma.department.create({
      data: { companyId, name: 'Operations', code: 'OPS', isActive: true }
    });
  }
  console.log('Department ready:', department.name);

  let designation = await prisma.designation.findFirst({ where: { companyId } });
  if (!designation) {
    designation = await prisma.designation.create({
      data: { companyId, name: 'Staff', code: 'STF', isActive: true }
    });
  }
  console.log('Designation ready:', designation.name);

  let shift = await prisma.shift.findFirst({ where: { companyId } });
  if (!shift) {
    shift = await prisma.shift.create({
      data: {
        companyId,
        name: 'Standard Shift',
        code: 'STD',
        startTime: '09:00',
        endTime: '18:00',
        workDays: [1, 2, 3, 4, 5],
        isActive: true
      }
    });
  }
  console.log('Shift ready:', shift.name);

  const roleNames = ['HR_ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE', 'CLIENT'];
  const roleMap = {};

  for (const rn of roleNames) {
    let r = await prisma.role.findFirst({
      where: {
        companyId,
        name: rn
      }
    });
    if (!r) {
      r = await prisma.role.findFirst({
        where: {
          name: rn
        }
      });
    }
    if (!r) {
      r = await prisma.role.create({
        data: {
          companyId,
          name: rn,
          displayName: rn.replace('_', ' '),
          isSystem: false
        }
      });
    }
    roleMap[rn] = r.id;
    console.log(`Role ${rn} ID: ${r.id}`);
  }

  const testUsers = [
    { email: 'hr.admin.test@mindstocs.com', role: 'HR_ADMIN', firstName: 'HR', lastName: 'Admin', phone: '+919876543201' },
    { email: 'hr.manager.test@mindstocs.com', role: 'HR_MANAGER', firstName: 'HR', lastName: 'Manager', phone: '+919876543202' },
    { email: 'manager.test@mindstocs.com', role: 'MANAGER', firstName: 'Team', lastName: 'Manager', phone: '+919876543203' },
    { email: 'employee.test@mindstocs.com', role: 'EMPLOYEE', firstName: 'Staff', lastName: 'Employee', phone: '+919876543204' },
    { email: 'client.test@mindstocs.com', role: 'CLIENT', firstName: 'Test', lastName: 'Client', phone: '+919876543205' }
  ];

  const passwordHash = await bcrypt.hash('Test@123456', 10);

  for (const tu of testUsers) {
    let user = await prisma.user.findUnique({ where: { email: tu.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: tu.email,
          passwordHash,
          phone: tu.phone,
          companyId,
          status: 'ACTIVE'
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          companyId,
          status: 'ACTIVE'
        }
      });
    }

    const roleId = roleMap[tu.role];
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId
      }
    });

    if (tu.role !== 'CLIENT') {
      let emp = await prisma.employee.findFirst({ where: { userId: user.id } });
      if (!emp) {
        emp = await prisma.employee.create({
          data: {
            userId: user.id,
            companyId,
            firstName: tu.firstName,
            lastName: tu.lastName,
            employeeCode: 'EMP-' + tu.role.substring(0, 3) + '-' + Math.floor(1000 + Math.random() * 9000),
            branchId: branch?.id,
            departmentId: department?.id,
            designationId: designation?.id,
            shiftId: shift?.id,
            isActive: true,
            status: 'ACTIVE',
            dateOfJoining: new Date()
          }
        });
      }
    } else {
      let cli = await prisma.client.findFirst({ where: { userId: user.id } });
      if (!cli) {
        cli = await prisma.client.create({
          data: {
            userId: user.id,
            companyId,
            companyName: 'Mindstocs Client Corp',
            contactPerson: tu.firstName + ' ' + tu.lastName,
            email: tu.email,
            phone: tu.phone,
            status: 'ACTIVE'
          }
        });
      }
    }
    console.log(`[OK] User ready: ${tu.email} (${tu.role})`);
  }

  console.log('SUCCESS: All 5 test users seeded for company:', company.name);
}

main()
  .catch(err => {
    console.error('Fatal seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
