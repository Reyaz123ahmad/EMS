import { prisma } from '../src/config/prisma.js';

async function audit() {
  const roleCounts = await prisma.$queryRaw`
    SELECT r.name, COUNT(ur."userId")::int as count
    FROM roles r
    LEFT JOIN user_roles ur ON r.id = ur."roleId"
    GROUP BY r.name
    ORDER BY count DESC;
  `;
  console.log('User counts per role:');
  console.table(roleCounts);
  await prisma.$disconnect();
}

audit().catch(console.error);
