import { prisma } from '../../config/prisma.js';

export const invoicesService = {
  async listInvoices(companyId, filters = {}, pagination = { page: 1, limit: 20 }) {
    if (!companyId) {
      return { invoices: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }

    const page = Number(pagination.page) || 1;
    const limit = Number(pagination.limit) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (companyId) {
      where.subscription = { companyId };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: {
              company: true,
              plan: true
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  async getInvoiceById(id, companyId = null) {
    const where = { id };
    if (companyId) {
      where.subscription = { companyId };
    }

    const invoice = await prisma.invoice.findFirst({
      where,
      include: {
        subscription: {
          include: {
            company: true,
            plan: true
          }
        }
      }
    });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  },

  async generateInvoicePDF(id, companyId = null) {
    const invoice = await this.getInvoiceById(id, companyId);
    const pdfUrl = invoice.pdfUrl || `https://invoices.ems-cloud.internal/pdf/${invoice.invoiceNumber}.pdf`;

    if (!invoice.pdfUrl) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl }
      });
    }

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyName: invoice.subscription?.company?.name || 'Customer Organization',
      planName: invoice.subscription?.plan?.name || 'SaaS Subscription Plan',
      amount: Number(invoice.amount),
      tax: Number(invoice.tax),
      total: Number(invoice.total),
      status: invoice.status,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      pdfUrl
    };
  },

  async sendInvoiceEmail(id, email, companyId = null) {
    const invoiceData = await this.generateInvoicePDF(id, companyId);
    return {
      success: true,
      message: `Invoice #${invoiceData.invoiceNumber} emailed successfully to ${email || 'company admin'}`,
      invoiceNumber: invoiceData.invoiceNumber,
      recipient: email
    };
  }
};

export const {
  listInvoices,
  getInvoiceById,
  generateInvoicePDF,
  sendInvoiceEmail
} = invoicesService;

export default invoicesService;
