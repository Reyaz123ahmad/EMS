import prisma from '../../config/prisma.js';

export async function findRefundById(id) {
  return prisma.refundRequest.findUnique({
    where: { id },
    include: {
      payment: true,
    },
  });
}

export async function findRefundsByCompany(companyId, filters = {}, pagination = { page: 1, limit: 20 }) {
  const { status, refundType, startDate, endDate } = filters;
  const where = { companyId };

  if (status) where.status = status;
  if (refundType) where.refundType = refundType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  const [total, refunds] = await Promise.all([
    prisma.refundRequest.count({ where }),
    prisma.refundRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    }),
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), refunds };
}

export async function findAllRefunds(filters = {}, pagination = { page: 1, limit: 20 }) {
  const { status, refundType, companyId, startDate, endDate } = filters;
  const where = {};

  if (companyId) where.companyId = companyId;
  if (status) where.status = status;
  if (refundType) where.refundType = refundType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const page = Number(pagination.page) || 1;
  const limit = Number(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  const [total, refunds] = await Promise.all([
    prisma.refundRequest.count({ where }),
    prisma.refundRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    }),
  ]);

  return { total, page, limit, totalPages: Math.ceil(total / limit), refunds };
}

export async function findRefundsByPayment(paymentId) {
  return prisma.refundRequest.findMany({
    where: { paymentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRefundRequest(data) {
  return prisma.refundRequest.create({
    data,
    include: { payment: true },
  });
}

export async function updateRefund(id, data) {
  return prisma.refundRequest.update({
    where: { id },
    data,
    include: { payment: true },
  });
}

export async function getRefundStats(companyId) {
  const where = companyId ? { companyId } : {};

  const [total, pending, approved, processed, rejected] = await Promise.all([
    prisma.refundRequest.count({ where }),
    prisma.refundRequest.count({ where: { ...where, status: 'PENDING' } }),
    prisma.refundRequest.count({ where: { ...where, status: 'APPROVED' } }),
    prisma.refundRequest.count({ where: { ...where, status: 'PROCESSED' } }),
    prisma.refundRequest.count({ where: { ...where, status: 'REJECTED' } }),
  ]);

  const aggregate = await prisma.refundRequest.aggregate({
    where: { ...where, status: 'PROCESSED' },
    _sum: { amount: true },
  });

  return {
    total,
    pending,
    approved,
    processed,
    rejected,
    totalRefundedAmount: aggregate._sum.amount || 0,
  };
}

export default {
  findRefundById,
  findRefundsByCompany,
  findAllRefunds,
  findRefundsByPayment,
  createRefundRequest,
  updateRefund,
  getRefundStats,
};
