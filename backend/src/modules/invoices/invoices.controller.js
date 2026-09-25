import prisma from '../../config/prisma.js';
import * as invoiceService from '../../services/invoice.service.js';

export async function listInvoices(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : req.user?.companyId || req.user?.company?.id;

    const where = {};
    if (companyId) {
      where.subscription = { companyId };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: { plan: true, company: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.generateInvoicePDF({ invoiceId: id });
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

export async function sendInvoiceEmail(req, res, next) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const result = await invoiceService.sendInvoiceEmail({ invoiceId: id, email });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  listInvoices,
  downloadInvoice,
  sendInvoiceEmail,
};
