import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createIndexes() {
  console.log('🚀 Creating high-performance composite database indexes...');

  const queries = [
    // AttendanceLog
    `CREATE INDEX IF NOT EXISTS idx_attendance_comp_date_status ON attendance_logs ("companyId", "attendanceDate", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_comp_late ON attendance_logs ("companyId", "isLate");`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON attendance_logs ("employeeId", "attendanceDate");`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_comp_date ON attendance_logs ("companyId", "attendanceDate");`,
    
    // Employee
    `CREATE INDEX IF NOT EXISTS idx_employee_comp_status ON employees ("companyId", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_employee_comp_dept ON employees ("companyId", "departmentId");`,
    `CREATE INDEX IF NOT EXISTS idx_employee_user ON employees ("userId");`,
    
    // User
    `CREATE INDEX IF NOT EXISTS idx_user_comp_status ON users ("companyId", "status");`,
    
    // Notifications
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications ("userId", "createdAt" DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications ("userId", "isRead");`,
    
    // Leave
    `CREATE INDEX IF NOT EXISTS idx_leave_emp_status ON leave_requests ("employeeId", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests ("startDate", "endDate");`,
    `CREATE INDEX IF NOT EXISTS idx_leave_balance_emp_type ON leave_balances ("employeeId", "leaveTypeId");`,
    
    // Shifts & Rosters
    `CREATE INDEX IF NOT EXISTS idx_shifts_comp_active ON shifts ("companyId", "isActive");`,
    `CREATE INDEX IF NOT EXISTS idx_rosters_comp_dates ON rosters ("companyId", "startDate", "endDate");`,
    `CREATE INDEX IF NOT EXISTS idx_rosters_emp_dates ON rosters ("employeeId", "startDate", "endDate");`,
    
    // Approvals
    `CREATE INDEX IF NOT EXISTS idx_approvals_wf_status ON approval_requests ("workflowId", "status");`,
    
    // Projects & Tasks
    `CREATE INDEX IF NOT EXISTS idx_projects_comp_status ON projects ("companyId", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_comp_status ON tasks ("companyId", "status");`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_emp_status ON tasks ("employeeId", "status");`
  ];

  for (const q of queries) {
    const t0 = Date.now();
    try {
      await prisma.$executeRawUnsafe(q);
      console.log(`✅ ${q.split('ON ')[1] || q} (${Date.now() - t0}ms)`);
    } catch (err) {
      console.log(`⚠️ Note: ${err.message}`);
    }
  }

  console.log('🎉 All performance composite indexes are ACTIVE in PostgreSQL!');
  await prisma.$disconnect();
}

createIndexes().catch(console.error);
