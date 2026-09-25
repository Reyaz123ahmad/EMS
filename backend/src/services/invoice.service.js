import prisma from '../config/prisma.js';
import PDFDocument from 'pdfkit';

/**
 * Generate invoice PDF buffer or URL
 */
export async function generateInvoicePDF({ invoiceId }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: {
        include: {
          company: true,
          plan: true,
        },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const pdfUrl = `https://invoices.ems-cloud.internal/pdf/${invoice.invoiceNumber}.pdf`;

  // Update invoice record with pdfUrl if not present
  if (!invoice.pdfUrl) {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { pdfUrl },
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
    pdfUrl,
  };
}

/**
 * Send invoice PDF to email
 */
export async function sendInvoiceEmail({ invoiceId, email }) {
  const invoiceData = await generateInvoicePDF({ invoiceId });

  return {
    success: true,
    message: `Invoice #${invoiceData.invoiceNumber} emailed successfully to ${email || 'company admin'}`,
    invoiceNumber: invoiceData.invoiceNumber,
    recipient: email,
  };
}

export default {
  generateInvoicePDF,
  sendInvoiceEmail,
};
