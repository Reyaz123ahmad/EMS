import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DB_URL = 'postgresql://postgres.prgljugedrwjlmxgtelp:Reyaz123%40AHmad@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

const prisma = new PrismaClient({
  datasources: {
    db: { url: DB_URL }
  }
});

async function main() {
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  console.log('Target Company:', { id: company?.id, name: company?.name });

  // Ensure default branch
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
  console.log('Branch ID:', branch.id);

  // Ensure default department
  let department = await prisma.department.findFirst({ where: { companyId } });
  if (!department) {
    department = await prisma.department.create({
      data: { companyId, name: 'Operations', code: 'OPS', isActive: true }
    });
  }
  console.log('Department ID:', department.id);

  // Ensure default designation
  let designation = await prisma.designation.findFirst({ where: { companyId } });
  if (!designation) {
    designation = await prisma.designation.create({
      data: { companyId, name: 'Staff', code: 'STF', isActive: true }
    });
  }
  console.log('Designation ID:', designation.id);

  // Ensure default shift
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
  console.log('Shift ID:', shift.id);

  // Find system / company roles
  const roles = await prisma.role.findMany({
    select: { id: true, name: true, companyId: true }
  });
  console.log('Available roles in DB:', roles.map(r => `${r.name} (${r.companyId ? 'company' : 'system'})`));

  const roleMap = {};
  for (const r of roles) {
    if (!roleMap[r.name] || r.companyId === companyId) {
      roleMap[r.name] = r.id;
    }
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
      console.log('Created User:', tu.email);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          companyId,
          status: 'ACTIVE'
        }
      });
      console.log('Updated User:', tu.email);
    }

    const roleId = roleMap[tu.role];
    if (roleId) {
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId
        }
      });
      console.log(`Assigned role ${tu.role} to ${tu.email}`);
    } else {
      console.warn(`Role ${tu.role} not found in DB!`);
    }

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
            branchId: branch.id,
            departmentId: department.id,
            designationId: designation.id,
            status: 'ACTIVE',
            joiningDate: new Date(),
            shiftAssignments: {
              create: {
                shiftId: shift.id,
                effectiveFrom: new Date()
              }
            }
          }
        });
        console.log('Created Employee profile for:', tu.email);
      }
    } else {
      let cli = await prisma.client.findFirst({ where: { userId: user.id } });
      if (!cli) {
        cli = await prisma.client.create({
          data: {
            userId: user.id,
            companyId,
            name: 'Mindstocs Client Corp',
            companyName: 'Mindstocs Client Corp',
            email: tu.email,
            phone: tu.phone,
            isActive: true
          }
        });
        console.log('Created Client profile for:', tu.email);
      }
    }
  }

  console.log('SUCCESS: All 5 test users verified for company:', company?.name);
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
