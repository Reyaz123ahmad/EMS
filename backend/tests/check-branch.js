import { prisma } from '../src/config/prisma.js';

async function check() {
  const branch = await prisma.branch.findUnique({
    where: { id: 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7' },
    include: { company: true }
  });
  console.log('Branch info:', JSON.stringify(branch, null, 2));
  await prisma.$disconnect();
}

check().catch(console.error);
