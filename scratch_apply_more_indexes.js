import prisma from './backend/src/config/prisma.js';

async function addMoreIndexes() {
  console.log('🚀 Adding additional composite indexes for fast dashboard joins...');

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_leave_emp_status_dates ON leave_requests ("employeeId", "status", "startDate", "endDate");`,
    `CREATE INDEX IF NOT EXISTS idx_emp_docs_emp_status ON employee_documents ("employeeId", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_emp_status_date ON attendance_logs ("employeeId", "status", "attendanceDate");`,
    `CREATE INDEX IF NOT EXISTS idx_approval_wf_status ON approval_requests ("workflowId", "status", "createdAt" DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_festival_cal_date ON festival_holidays ("calendarId", "date" ASC);`,
    `CREATE INDEX IF NOT EXISTS idx_payroll_emp_created ON payroll_items ("employeeId", "createdAt" DESC);`
  ];

  for (const idx of indexes) {
    const t0 = performance.now();
    try {
      await prisma.$executeRawUnsafe(idx);
      console.log(`✅ Applied ${idx.split('ON ')[1] || idx} (${Math.round(performance.now() - t0)}ms)`);
    } catch (e) {
      console.log(`⚠️ ${e.message}`);
    }
  }

  console.log('🎉 Additional indexes applied successfully!');
  await prisma.$disconnect();
}

addMoreIndexes().catch(console.error);
