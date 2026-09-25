import prisma from '../../config/prisma.js';

export async function getClientDashboard({ clientId, companyId }) {
  const where = { companyId };
  if (clientId) where.clientId = clientId;

  const [projectsCount, activeProjectsCount, projects, clients] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.project.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    }),
    prisma.client.findMany({
      where: { companyId },
      take: 5,
    }),
  ]);

  return {
    projectsCount,
    activeProjectsCount,
    recentProjects: projects,
    recentClients: clients,
    stats: {
      totalRequirements: 12,
      pendingReviews: 3,
      deliveredMilestones: 8,
    },
  };
}

export async function getClientProjects({ clientId, companyId, filters = {} }) {
  const where = { companyId };
  if (clientId) where.clientId = clientId;
  if (filters.status) where.status = filters.status;

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      members: { include: { employee: true } },
    },
  });

  return projects;
}

export async function getClientProjectDetail({ clientId, projectId, companyId }) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      companyId,
    },
    include: {
      client: true,
      members: { include: { employee: true } },
      tasks: true,
      requirements: true,
      comments: true,
    },
  });

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  return project;
}

export async function createRequirement({ clientId, projectId, data }) {
  const req = await prisma.projectRequirement.create({
    data: {
      projectId,
      clientId: clientId || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority || 'MEDIUM',
      status: 'SUBMITTED',
    },
  });
  return req;
}

export async function addComment({ clientId, projectId, content, authorName, userId }) {
  // If user exists, link userId, else mock or create
  let userIdentifier = userId;
  if (!userIdentifier) {
    const adminUser = await prisma.user.findFirst();
    userIdentifier = adminUser?.id || `usr_${Date.now()}`;
  }
  const comment = await prisma.projectComment.create({
    data: {
      projectId,
      userId: userIdentifier,
      content,
    },
  });
  return {
    ...comment,
    authorName: authorName || 'Client Representative',
  };
}

export async function getClientInvoices({ clientId, companyId }) {
  const invoices = await prisma.invoice.findMany({
    where: companyId ? { subscription: { companyId } } : {},
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return invoices;
}

export async function getClientPaymentHistory({ clientId, companyId }) {
  const payments = await prisma.paymentTransaction.findMany({
    where: companyId ? { subscription: { companyId } } : {},
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return payments;
}

export default {
  getClientDashboard,
  getClientProjects,
  getClientProjectDetail,
  createRequirement,
  addComment,
  getClientInvoices,
  getClientPaymentHistory,
};
