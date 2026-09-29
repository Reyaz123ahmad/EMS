import { prisma } from '../config/prisma.js';

async function migrate() {
  console.log('Running payroll migration DDL...');

  // 1. Add company columns if not exist
  const companyAlterStatements = [
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payrollCycleStartDay" INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payrollCycleEndDay" INTEGER NOT NULL DEFAULT 0;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payrollRunDay" INTEGER NOT NULL DEFAULT 1;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payrollRunTime" TEXT NOT NULL DEFAULT '00:05';`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "payrollAutoRunEnabled" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "overtimeRate" DECIMAL(10,2) DEFAULT 0;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "lopDivisor" INTEGER NOT NULL DEFAULT 30;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "lateMarksForHalfDay" INTEGER NOT NULL DEFAULT 3;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "roundOffRule" TEXT NOT NULL DEFAULT 'NEAREST_RUPEE';`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pfEnabled" BOOLEAN NOT NULL DEFAULT true;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pfEmployeePercent" DECIMAL(5,2) DEFAULT 12.00;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pfEmployerPercent" DECIMAL(5,2) DEFAULT 12.00;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "pfCeiling" DECIMAL(12,2) DEFAULT 15000.00;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "esiEnabled" BOOLEAN NOT NULL DEFAULT true;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "esiEmployeePercent" DECIMAL(5,2) DEFAULT 0.75;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "esiEmployerPercent" DECIMAL(5,2) DEFAULT 3.25;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "esiCeiling" DECIMAL(12,2) DEFAULT 21000.00;`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "ptState" TEXT DEFAULT 'MAHARASHTRA';`,
    `ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "tdsEnabled" BOOLEAN NOT NULL DEFAULT true;`
  ];

  for (const stmt of companyAlterStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.warn('Company alter stmt note:', e.message);
    }
  }
  console.log('Company columns updated.');

  // 2. Create payslip_line_items table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "payslip_line_items" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "payrollItemId" TEXT NOT NULL,
      "componentId" TEXT,
      "componentName" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "amount" DECIMAL(12,2) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "payslip_line_items_payrollItemId_fkey" FOREIGN KEY ("payrollItemId") REFERENCES "payroll_items"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "payslip_line_items_payrollItemId_idx" ON "payslip_line_items"("payrollItemId");`);
  console.log('payslip_line_items table created/verified.');

  // 3. Create loans table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "loans" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "principal" DECIMAL(12,2) NOT NULL,
      "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
      "tenureMonths" INTEGER NOT NULL,
      "emiAmount" DECIMAL(12,2) NOT NULL,
      "startDate" TIMESTAMP(3) NOT NULL,
      "endDate" TIMESTAMP(3),
      "remainingAmount" DECIMAL(12,2) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "loans_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "loans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "loans_employeeId_status_idx" ON "loans"("employeeId", "status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "loans_companyId_status_idx" ON "loans"("companyId", "status");`);
  console.log('loans table created/verified.');

  // 4. Create reimbursements table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "reimbursements" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "employeeId" TEXT NOT NULL,
      "companyId" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "amount" DECIMAL(12,2) NOT NULL,
      "billDate" TIMESTAMP(3) NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "approvedBy" TEXT,
      "approvedAt" TIMESTAMP(3),
      "paidInPayrollRunId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "reimbursements_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "reimbursements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reimbursements_employeeId_status_idx" ON "reimbursements"("employeeId", "status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reimbursements_companyId_status_idx" ON "reimbursements"("companyId", "status");`);
  console.log('reimbursements table created/verified.');

  console.log('All migrations applied successfully!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
