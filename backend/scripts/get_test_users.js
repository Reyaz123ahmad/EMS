import prisma from '../src/config/prisma.js';

async function listUsers() {
  const users = await prisma.user.findMany({
    where: {
      employee: { isNot: null }
    },
    take: 5,
    include: {
      employee: true,
      userRoles: {
        include: { role: true }
      }
    }
  });

  console.log('Found employee users:', users.map(u => ({
    id: u.id,
    email: u.email,
    name: `${u.employee?.firstName} ${u.employee?.lastName}`,
    employeeId: u.employee?.id,
    roles: u.userRoles.map(r => r.role.name)
  })));

  await prisma.$disconnect();
}

listUsers();
