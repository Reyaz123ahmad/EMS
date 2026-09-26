import prisma from '../../config/prisma.js';

export const employeesRepository = {
  /**
   * Find employee by ID or employeeCode with department, designation, branch, manager and user
   * @param {string} idOrCode 
   * @param {string} companyId (optional)
   */
  async findEmployeeById(idOrCode, companyId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const where = isUuid
      ? { id: idOrCode }
      : (companyId ? { companyId_employeeCode: { companyId, employeeCode: idOrCode } } : { employeeCode: idOrCode });

    return prisma.employee.findFirst({
      where: isUuid ? { id: idOrCode } : { employeeCode: idOrCode, ...(companyId ? { companyId } : {}) },
      include: {
        department: true,
        designation: true,
        branch: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            lastLoginAt: true,
            userRoles: {
              include: { role: true }
            }
          }
        },
        leaveBalances: {
          include: { leaveType: true }
        }
      }
    });
  },

  /**
   * Alias for findEmployeeById
   */
  async findByIdOrCode(idOrCode, companyId) {
    return this.findEmployeeById(idOrCode, companyId);
  },

  /**
   * Find employee by email
   * @param {string} email 
   */
  async findEmployeeByEmail(email) {
    return prisma.employee.findFirst({
      where: { email }
    });
  },

  /**
   * Find employee by companyId and employee code
   * @param {string} companyId 
   * @param {string} employeeCode 
   */
  async findEmployeeByCode(companyId, employeeCode) {
    return prisma.employee.findFirst({
      where: {
        companyId,
        employeeCode
      }
    });
  },

  /**
   * List all company employees with filters & pagination
   * @param {string} companyId 
   * @param {Object} filters 
   * @param {Object} pagination 
   */
  async findAllEmployees(companyId, filters = {}, pagination = { page: 1, limit: 10 }) {
    const { departmentId, designationId, branchId, status, search, employeeCode } = filters;
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (departmentId && departmentId !== '') where.departmentId = departmentId;
    if (designationId && designationId !== '') where.designationId = designationId;
    if (branchId && branchId !== '') where.branchId = branchId;
    if (status && status !== '') where.status = status;
    if (employeeCode && employeeCode !== '') where.employeeCode = { contains: employeeCode, mode: 'insensitive' };

    if (search && search.trim() !== '') {
      where.OR = [
        { firstName: { contains: search.trim(), mode: 'insensitive' } },
        { lastName: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { employeeCode: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: true,
          designation: true,
          branch: true
        }
      })
    ]);

    return { total, page, limit, employees };
  },

  /**
   * Create employee
   * @param {Object} data 
   */
  async createEmployee(data) {
    return prisma.employee.create({ data });
  },

  /**
   * Update employee
   * @param {string} id 
   * @param {Object} data 
   */
  async updateEmployee(id, data) {
    return prisma.employee.update({
      where: { id },
      data
    });
  },

  /**
   * Delete employee
   * @param {string} id 
   */
  async deleteEmployee(id) {
    return prisma.employee.delete({
      where: { id }
    });
  },

  /**
   * Auto-generate sequential employee code: {PREFIX}-EMP-{SEQ}
   * @param {string} companyId 
   */
  async generateEmployeeCode(companyId) {
    const { generateEmployeeCode } = await import('../../utils/id-generator.js');
    return generateEmployeeCode(companyId);
  },

  /**
   * Assign role to user
   * @param {string} userId 
   * @param {string} roleId 
   */
  async assignUserRole(userId, roleId) {
    return prisma.userRole.create({
      data: { userId, roleId }
    });
  },

  /**
   * Find default branch for company
   * @param {string} companyId 
   */
  async findDefaultBranch(companyId) {
    return prisma.branch.findFirst({ where: { companyId } });
  },

  /**
   * Find default department for company
   * @param {string} companyId 
   */
  async findDefaultDepartment(companyId) {
    return prisma.department.findFirst({ where: { companyId } });
  }
};

export default employeesRepository;
