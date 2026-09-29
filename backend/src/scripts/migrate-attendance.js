import { prisma } from '../config/prisma.js';

async function main() {
  try {
    console.log('Running attendance_logs column addition...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "attendance_logs" 
        ADD COLUMN IF NOT EXISTS "shiftSource" TEXT,
        ADD COLUMN IF NOT EXISTS "expectedStart" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "expectedEnd" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "isRosterOverride" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "earlyExitMinutes" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "workedMinutes" INTEGER;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "attendance_logs_shiftId_idx" ON "attendance_logs"("shiftId");
    `);

    console.log('SUCCESS: AttendanceLog columns and index synced in PostgreSQL!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
