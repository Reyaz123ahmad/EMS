import prisma from '../config/prisma.js';

/**
 * Calculate GST breakdown (CGST + SGST or IGST) based on interstate status
 */
export function calculateGST({ amount, companyState = 'Maharashtra', customerState = 'Maharashtra' }) {
  const baseAmount = Number(amount) || 0;
  const isInterstate = companyState.trim().toLowerCase() !== customerState.trim().toLowerCase();

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = Math.round(baseAmount * 0.18 * 100) / 100;
  } else {
    cgst = Math.round(baseAmount * 0.09 * 100) / 100;
    sgst = Math.round(baseAmount * 0.09 * 100) / 100;
  }

  const totalTax = Math.round((cgst + sgst + igst) * 100) / 100;
  const total = Math.round((baseAmount + totalTax) * 100) / 100;

  return {
    baseAmount,
    isInterstate,
    companyState,
    customerState,
    cgst,
    sgst,
    igst,
    totalTax,
    total,
    taxRatePercentage: 18,
  };
}

/**
 * Detailed tax breakdown for an invoice
 */
export async function getTaxBreakdown({ invoiceId }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      subscription: {
        include: { company: true },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  const company = invoice.subscription?.company;
  const customerState = company?.address?.includes('Delhi') ? 'Delhi' : 'Maharashtra';

  return {
    invoiceNumber: invoice.invoiceNumber,
    ...calculateGST({
      amount: invoice.amount,
      companyState: 'Maharashtra',
      customerState,
    }),
  };
}

/**
 * Generate GST compliant tax invoice document
 */
export async function generateGSTInvoice({ invoiceId }) {
  const breakdown = await getTaxBreakdown({ invoiceId });
  return {
    success: true,
    invoiceId,
    gstinSupplier: '27AABCM1234F1Z5',
    breakdown,
    qrCodeString: `GST-INV:${breakdown.invoiceNumber}|TOTAL:${breakdown.total}`,
  };
}

export default {
  calculateGST,
  getTaxBreakdown,
  generateGSTInvoice,
};
