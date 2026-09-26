import prisma from '../../config/prisma.js';

export const companiesRepository = {
  /**
   * Find company by ID or companyCode with subscription & counts
   * @param {string} idOrCode 
   */
  async findCompanyById(idOrCode) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    const where = isUuid ? { id: idOrCode } : { companyCode: idOrCode };
    return prisma.company.findUnique({
      where,
      include: {
        subscription: {
          include: { plan: true }
        },
        _count: {
          select: {
            employees: true,
            branches: true,
            departments: true,
            biometricDevices: true
          }
        }
      }
    });
  },

  /**
   * Alias for findCompanyById supporting both UUID and companyCode
   */
  async findByIdOrCode(idOrCode) {
    return this.findCompanyById(idOrCode);
  },

  /**
   * Find company by domain
   * @param {string} domain 
   */
  async findCompanyByDomain(domain) {
    return prisma.company.findUnique({
      where: { domain }
    });
  },

  /**
   * List all companies with pagination & filtering
   * @param {Object} filters 
   * @param {Object} pagination 
   */
  async findAllCompanies(filters = {}, pagination = { page: 1, limit: 10 }) {
    const { search, status, companyCode } = filters;
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (companyCode) {
      where.companyCode = { contains: companyCode, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: { plan: true }
          },
          _count: {
            select: {
              employees: true,
              branches: true
            }
          }
        }
      })
    ]);

    return { total, page, limit, companies };
  },

  /**
   * Create company
   * @param {Object} data 
   */
  async createCompany(data) {
    return prisma.company.create({ data });
  },

  /**
   * Update company
   * @param {string} id 
   * @param {Object} data 
   */
  async updateCompany(id, data) {
    return prisma.company.update({
      where: { id },
      data
    });
  },

  /**
   * Delete company
   * @param {string} id 
   */
  async deleteCompany(id) {
    return prisma.company.delete({
      where: { id }
    });
  },

  /**
   * Update specific JSON setting field
   * @param {string} id 
   * @param {string} settingsField 
   * @param {Object} settingsData 
   */
  async updateCompanySettings(id, settingsField, settingsData) {
    return prisma.company.update({
      where: { id },
      data: {
        [settingsField]: settingsData
      }
    });
  },

  /**
   * Find plan by ID
   * @param {string} planId 
   */
  async findPlanById(planId) {
    return prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });
  },

  /**
   * Find default or starter plan
   */
  async findDefaultPlan() {
    let plan = await prisma.subscriptionPlan.findFirst({
      where: { name: 'Pro', isActive: true }
    });
    if (!plan) {
      plan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true }
      });
    }
    return plan;
  },

  /**
   * Create Subscription
   * @param {Object} data 
   */
  async createSubscription(data) {
    return prisma.subscription.create({ data });
  },

  /**
   * Update Subscription
   * @param {string} id 
   * @param {Object} data 
   */
  async updateSubscription(id, data) {
    return prisma.subscription.update({
      where: { id },
      data
    });
  },

  /**
   * Find system role by name
   * @param {string} name 
   */
  async findRoleByName(name) {
    return prisma.role.findFirst({
      where: {
        name,
        companyId: null
      }
    });
  }
};

export default companiesRepository;
