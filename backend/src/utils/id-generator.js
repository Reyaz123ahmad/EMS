import prisma from '../config/prisma.js';

/**
 * Get uppercase prefix from company name (first 4 alphabetic characters)
 */
export async function getCompanyPrefix(companyId) {
  if (!companyId) return 'MIND';
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });
    if (!company?.name) return 'MIND';
    const cleaned = company.name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return cleaned.slice(0, 4) || 'MIND';
  } catch {
    return 'MIND';
  }
}

/**
 * Generate unique company code: COMP-{YYYY}-{SEQ}
 */
export async function generateCompanyCode() {
  const year = new Date().getFullYear();
  const count = await prisma.company.count();
  const seq = String(count + 1).padStart(4, '0');
  let code = `COMP-${year}-${seq}`;

  // Ensure uniqueness
  let exists = await prisma.company.findUnique({ where: { companyCode: code } });
  let counter = count + 1;
  while (exists) {
    counter++;
    code = `COMP-${year}-${String(counter).padStart(4, '0')}`;
    exists = await prisma.company.findUnique({ where: { companyCode: code } });
  }

  return code;
}

/**
 * Generate unique employee code: {PREFIX}-EMP-{SEQ}
 */
export async function generateEmployeeCode(companyId) {
  const prefix = await getCompanyPrefix(companyId);
  const count = await prisma.employee.count({ where: { companyId } });
  const seq = String(count + 1).padStart(4, '0');
  let code = `${prefix}-EMP-${seq}`;

  let exists = await prisma.employee.findFirst({
    where: { companyId, employeeCode: code },
  });
  let counter = count + 1;
  while (exists) {
    counter++;
    code = `${prefix}-EMP-${String(counter).padStart(4, '0')}`;
    exists = await prisma.employee.findFirst({
      where: { companyId, employeeCode: code },
    });
  }

  return code;
}

/**
 * Generate unique branch code: {PREFIX}-BR-{SEQ}
 */
export async function generateBranchCode(companyId) {
  const prefix = await getCompanyPrefix(companyId);
  const count = await prisma.branch.count({ where: { companyId } });
  const seq = String(count + 1).padStart(4, '0');
  let code = `${prefix}-BR-${seq}`;

  let exists = await prisma.branch.findFirst({
    where: { companyId, branchCode: code },
  });
  let counter = count + 1;
  while (exists) {
    counter++;
    code = `${prefix}-BR-${String(counter).padStart(4, '0')}`;
    exists = await prisma.branch.findFirst({
      where: { companyId, branchCode: code },
    });
  }

  return code;
}

/**
 * Generate unique department code: {PREFIX}-DEPT-{SEQ}
 */
export async function generateDepartmentCode(companyId) {
  const prefix = await getCompanyPrefix(companyId);
  const count = await prisma.department.count({ where: { companyId } });
  const seq = String(count + 1).padStart(4, '0');
  let code = `${prefix}-DEPT-${seq}`;

  let exists = await prisma.department.findFirst({
    where: { companyId, departmentCode: code },
  });
  let counter = count + 1;
  while (exists) {
    counter++;
    code = `${prefix}-DEPT-${String(counter).padStart(4, '0')}`;
    exists = await prisma.department.findFirst({
      where: { companyId, departmentCode: code },
    });
  }

  return code;
}

/**
 * Generate unique designation code: {PREFIX}-DESG-{SEQ}
 */
export async function generateDesignationCode(companyId) {
  const prefix = await getCompanyPrefix(companyId);
  const count = await prisma.designation.count({ where: { companyId } });
  const seq = String(count + 1).padStart(4, '0');
  let code = `${prefix}-DESG-${seq}`;

  let exists = await prisma.designation.findFirst({
    where: { companyId, designationCode: code },
  });
  let counter = count + 1;
  while (exists) {
    counter++;
    code = `${prefix}-DESG-${String(counter).padStart(4, '0')}`;
    exists = await prisma.designation.findFirst({
      where: { companyId, designationCode: code },
    });
  }

  return code;
}

export default {
  getCompanyPrefix,
  generateCompanyCode,
  generateEmployeeCode,
  generateBranchCode,
  generateDepartmentCode,
  generateDesignationCode,
};
