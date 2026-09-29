import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, status: true, companyId: true, userRoles: { include: { role: true } } },
    take: 10
  });
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}
run();
