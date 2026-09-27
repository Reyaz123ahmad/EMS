import { PrismaClient } from '@prisma/client';

async function testConn(url) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRaw`SELECT 1 as val`;
    console.log('SUCCESS with:', url.replace(/:[^:@]+@/, ':***@'), res);
    await p.$disconnect();
    return true;
  } catch (e) {
    console.log('FAILED with:', url.replace(/:[^:@]+@/, ':***@'), e.message.split('\n')[0]);
    await p.$disconnect();
    return false;
  }
}

async function main() {
  const base = 'postgresql://postgres.prgljugedrwjlmxgtelp:Reyaz123%40AHmad@aws-0-ap-southeast-2.pooler.supabase.com';
  await testConn(base + ':5432/postgres');
  await testConn(base + ':5432/postgres?sslmode=require');
  await testConn(base + ':6543/postgres?pgbouncer=true');
  await testConn(base + ':6543/postgres?pgbouncer=true&sslmode=require');
  await testConn(base + ':6543/postgres?pgbouncer=true&connection_limit=1');
  await testConn(base + ':5432/postgres?connect_timeout=30');
}

main();
