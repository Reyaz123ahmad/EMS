import { prisma } from '../src/config/prisma.js';

async function main() {
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' }
  });
  console.log('ROLES IN DB:', roles);

  const userRoles = await prisma.userRole.findMany({
    include: { role: true }
  });
  const counts = {};
  for (const ur of userRoles) {
    counts[ur.role.name] = (counts[ur.role.name] || 0) + 1;
  }
  console.log('USER ROLES COUNT:', counts);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
