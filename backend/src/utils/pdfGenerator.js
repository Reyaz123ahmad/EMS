import PDFDocument from 'pdfkit';
import { logger } from '../config/logger.js';

/**
 * Generate a clean, professional Payment Receipt PDF stream
 */
export function generatePaymentReceiptPDF(payment, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.razorpayOrderId || payment.id.slice(0, 8)}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#1e293b').text('PAYMENT RECEIPT', { align: 'right' });
  doc.fontSize(10).fillColor('#64748b').text(`Receipt #: REC-${(payment.razorpayPaymentId || payment.id).slice(0, 10).toUpperCase()}`, { align: 'right' });
  doc.text(`Date: ${new Date(payment.createdAt || Date.now()).toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown();

  // Branding
  doc.fontSize(16).fillColor('#4f46e5').text('EMS Cloud Platform', 50, 50);
  doc.fontSize(10).fillColor('#64748b').text('Enterprise Workforce Management & Payroll Solutions');
  doc.moveDown(2);

  // Divider
  doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e2e8f0').stroke();
  doc.moveDown();

  // Bill To
  doc.fontSize(12).fillColor('#1e293b').text('Bill To:', 50, 125);
  doc.fontSize(10).fillColor('#334155').text(payment.subscription?.company?.name || 'Customer Organization');
  doc.text(payment.subscription?.company?.email || 'billing@customer.com');
  doc.moveDown();

  // Payment Details Box
  const tableTop = 180;
  doc.rect(50, tableTop, 495, 25).fill('#f8fafc');
  doc.fontSize(10).fillColor('#475569').text('Description', 60, tableTop + 7);
  doc.text('Transaction ID', 240, tableTop + 7);
  doc.text('Status', 380, tableTop + 7);
  doc.text('Amount (INR)', 450, tableTop + 7, { align: 'right', width: 85 });

  doc.fillColor('#1e293b');
  const planName = payment.subscription?.plan?.name || 'SaaS Enterprise Subscription';
  doc.text(`${planName} Renewal`, 60, tableTop + 35);
  doc.fontSize(9).fillColor('#64748b').text(payment.razorpayPaymentId || payment.id.slice(0, 18), 240, tableTop + 35);
  doc.fontSize(10).fillColor(payment.status === 'SUCCESS' ? '#16a34a' : '#dc2626').text(payment.status || 'SUCCESS', 380, tableTop + 35);
  doc.fillColor('#1e293b').text(`Rs. ${Number(payment.amount || 0).toLocaleString('en-IN')}`, 450, tableTop + 35, { align: 'right', width: 85 });

  doc.moveTo(50, tableTop + 60).lineTo(545, tableTop + 60).strokeColor('#e2e8f0').stroke();

  // Summary
  const totalTop = tableTop + 75;
  doc.fontSize(11).fillColor('#1e293b').text('Total Paid:', 350, totalTop);
  doc.fontSize(12).fillColor('#4f46e5').text(`Rs. ${Number(payment.amount || 0).toLocaleString('en-IN')}`, 450, totalTop, { align: 'right', width: 85 });

  // Footer
  doc.fontSize(9).fillColor('#94a3b8').text('Thank you for choosing EMS Platform. This is a computer-generated receipt.', 50, 700, { align: 'center', width: 495 });

  doc.end();
}

/**
 * Generate Invoice PDF Stream
 */
export function generateInvoicePDFStream(invoice, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber || invoice.id.slice(0, 8)}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(22).fillColor('#1e293b').text('TAX INVOICE', { align: 'right' });
  doc.fontSize(10).fillColor('#64748b').text(`Invoice #: ${invoice.invoiceNumber || 'INV-' + invoice.id.slice(0, 8).toUpperCase()}`, { align: 'right' });
  doc.text(`Invoice Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.text(`Status: ${invoice.status || 'PAID'}`, { align: 'right' });

  // Brand
  doc.fontSize(16).fillColor('#4f46e5').text('EMS Cloud Platform', 50, 50);
  doc.fontSize(9).fillColor('#64748b').text('GSTIN: 27AABCE1234F1Z5 | PAN: AABCE1234F');
  doc.moveDown(2);

  // Divider
  doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#e2e8f0').stroke();

  // Billed To
  const comp = invoice.subscription?.company || invoice.company || {};
  doc.fontSize(11).fillColor('#1e293b').text('Billed To:', 50, 130);
  doc.fontSize(10).fillColor('#334155').text(comp.name || 'Tenant Organization');
  doc.text(comp.email || 'billing@organization.com');
  doc.text(`Company Code: ${comp.companyCode || 'COMP-ORG'}`);

  // Table
  const tableTop = 200;
  doc.rect(50, tableTop, 495, 25).fill('#f8fafc');
  doc.fontSize(10).fillColor('#475569').text('Item Description', 60, tableTop + 7);
  doc.text('Billing Cycle', 280, tableTop + 7);
  doc.text('Tax', 370, tableTop + 7);
  doc.text('Total (INR)', 450, tableTop + 7, { align: 'right', width: 85 });

  const planName = invoice.subscription?.plan?.name || 'Enterprise Cloud Subscription';
  doc.fillColor('#1e293b');
  doc.text(planName, 60, tableTop + 35);
  doc.text('Monthly/Annual', 280, tableTop + 35);
  doc.text(`Rs. ${Number(invoice.tax || 0).toLocaleString('en-IN')}`, 370, tableTop + 35);
  doc.text(`Rs. ${Number(invoice.total || invoice.amount || 0).toLocaleString('en-IN')}`, 450, tableTop + 35, { align: 'right', width: 85 });

  doc.moveTo(50, tableTop + 60).lineTo(545, tableTop + 60).strokeColor('#e2e8f0').stroke();

  // Grand Total
  const totalTop = tableTop + 80;
  doc.fontSize(12).fillColor('#1e293b').text('Grand Total:', 350, totalTop);
  doc.fontSize(13).fillColor('#4f46e5').text(`Rs. ${Number(invoice.total || invoice.amount || 0).toLocaleString('en-IN')}`, 450, totalTop, { align: 'right', width: 85 });

  doc.fontSize(9).fillColor('#94a3b8').text('This is an electronically generated valid tax invoice.', 50, 720, { align: 'center', width: 495 });

  doc.end();
}

/**
 * Generate Salary Slip PDF Stream
 */
export function generateSalarySlipPDFStream(slip, res) {
  let lineItems = slip?.payrollItem?.lineItems || slip?.lineItems || [];

  if (!lineItems || lineItems.length === 0) {
    const gross = Number(slip?.payrollItem?.grossSalary || slip?.grossSalary || 0);
    const ded = Number(slip?.payrollItem?.totalDeductions || slip?.deductions || 0);
    if (gross > 0 || ded > 0) {
      lineItems = [
        { componentName: 'Basic Salary & Allowances', type: 'EARNING', amount: gross },
        ...(ded > 0 ? [{ componentName: 'Total Deductions', type: 'DEDUCTION', amount: ded }] : [])
      ];
    }
  }

  if (!lineItems || lineItems.length === 0) {
    const slipId = slip?.id || slip?.slipNumber || 'UNKNOWN';
    logger.error({ slipId }, 'PDF gen refused: no component breakdown or salary data');
    if (res && typeof res.status === 'function' && !res.headersSent) {
      return res.status(500).json({
        status: 'error',
        message: 'PDF gen refused: no component breakdown or salary data'
      });
    }
    const err = new Error('PDF gen refused: no component breakdown or salary data');
    err.statusCode = 500;
    throw err;
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const emp = slip.payrollItem?.employee || slip.employee || {};
  const empName = `${emp.firstName || 'Employee'} ${emp.lastName || ''}`.trim();
  const payrollItem = slip.payrollItem || {};
  const month = payrollItem.payrollRun?.month || slip.month || 'Current';
  const year = payrollItem.payrollRun?.year || slip.year || new Date().getFullYear();

  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="salary-slip-${emp.employeeCode || slip.id?.slice(0, 8) || 'slip'}.pdf"`);
    doc.pipe(res);
  }

  doc.fontSize(18).fillColor('#1e293b').text('PAYSLIP / SALARY STATEMENT', { align: 'center' });
  doc.fontSize(10).fillColor('#64748b').text(`Month: ${month} / Year: ${year}`, { align: 'center' });
  doc.moveDown();

  doc.moveTo(50, 95).lineTo(545, 95).strokeColor('#e2e8f0').stroke();

  // Employee details
  doc.fontSize(10).fillColor('#1e293b');
  doc.text(`Employee Name: ${empName}`, 50, 110);
  doc.text(`Employee Code: ${emp.employeeCode || 'N/A'}`, 50, 125);
  doc.text(`Designation: ${emp.designation?.name || emp.designation || 'Staff'}`, 50, 140);
  doc.text(`Department: ${emp.department?.name || emp.department || 'General'}`, 50, 155);

  const presentDays = payrollItem.presentDays !== undefined ? payrollItem.presentDays : (slip.presentDays || 0);
  const absentDays = payrollItem.absentDays !== undefined ? payrollItem.absentDays : (slip.absentDays || 0);
  const leaveDays = payrollItem.leaveDays !== undefined ? payrollItem.leaveDays : (slip.leaveDays || 0);

  doc.text(`Present Days: ${presentDays}`, 350, 110);
  doc.text(`Absent / LOP Days: ${absentDays}`, 350, 125);
  doc.text(`Leave Days: ${leaveDays}`, 350, 140);

  const tableTop = 185;
  doc.rect(50, tableTop, 240, 22).fill('#f1f5f9');
  doc.rect(300, tableTop, 245, 22).fill('#f1f5f9');
  doc.fontSize(10).fillColor('#334155').text('EARNINGS', 60, tableTop + 6);
  doc.text('DEDUCTIONS', 310, tableTop + 6);

  const earnings = lineItems.filter((l) => l.type === 'EARNING');
  const deductions = lineItems.filter((l) => l.type === 'DEDUCTION');
  const maxRows = Math.max(earnings.length, deductions.length);

  let y = tableTop + 30;
  doc.fontSize(9).fillColor('#1e293b');

  let totalEarnings = 0;
  let totalDeductions = 0;

  for (let i = 0; i < maxRows; i++) {
    const earn = earnings[i];
    const ded = deductions[i];

    if (earn) {
      const amt = Number(earn.amount);
      totalEarnings += amt;
      doc.text(earn.componentName, 60, y, { width: 155, ellipsis: true });
      doc.text(`Rs. ${amt.toLocaleString('en-IN')}`, 220, y, { align: 'right', width: 60 });
    }

    if (ded) {
      const amt = Number(ded.amount);
      totalDeductions += amt;
      doc.text(ded.componentName, 310, y, { width: 155, ellipsis: true });
      doc.text(`Rs. ${amt.toLocaleString('en-IN')}`, 470, y, { align: 'right', width: 60 });
    }

    y += 18;
  }

  const netSalary = Number(payrollItem.netSalary ?? (totalEarnings - totalDeductions));

  y += 15;
  doc.rect(50, y, 495, 25).fill('#e0e7ff');
  doc.fontSize(11).fillColor('#3730a3').text('NET PAYABLE SALARY:', 60, y + 7);
  doc.fontSize(12).fillColor('#3730a3').text(`Rs. ${netSalary.toLocaleString('en-IN')}`, 400, y + 6, { align: 'right', width: 135 });

  doc.fontSize(9).fillColor('#94a3b8').text('Confidential - Generated automatically by EMS Platform.', 50, 720, { align: 'center', width: 495 });

  doc.end();
  return doc;
}

/**
 * Generate Certificate PDF Stream
 */
export function generateCertificatePDFStream(cert, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateNumber || cert.id.slice(0, 8)}.pdf"`);

  doc.pipe(res);

  const empName = cert.employee ? `${cert.employee.firstName || ''} ${cert.employee.lastName || ''}`.trim() : 'Employee';

  // Border Frame
  doc.rect(25, 25, 792, 545).strokeColor('#4f46e5').lineWidth(3).stroke();
  doc.rect(32, 32, 778, 531).strokeColor('#cbd5e1').lineWidth(1).stroke();

  doc.fontSize(28).fillColor('#1e293b').text('CERTIFICATE OF APPRECIATION', 0, 90, { align: 'center' });
  doc.fontSize(12).fillColor('#64748b').text('THIS CERTIFICATE IS PROUDLY PRESENTED TO', 0, 140, { align: 'center' });

  doc.fontSize(26).fillColor('#4f46e5').text(empName, 0, 180, { align: 'center' });
  doc.fontSize(12).fillColor('#334155').text(
    `In recognition of outstanding dedication, professional excellence, and invaluable contributions to the organization.`,
    150, 240, { align: 'center', width: 542 }
  );

  doc.fontSize(10).fillColor('#64748b').text(`Certificate ID: ${cert.certificateNumber || 'CERT-' + cert.id.slice(0, 8).toUpperCase()}`, 100, 440);
  doc.text(`Issue Date: ${new Date(cert.issuedAt || cert.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 100, 460);

  doc.text('Authorized Signatory', 550, 440, { align: 'center', width: 160 });
  doc.moveTo(550, 435).lineTo(710, 435).strokeColor('#94a3b8').stroke();

  doc.end();
}

export default {
  generatePaymentReceiptPDF,
  generateInvoicePDFStream,
  generateSalarySlipPDFStream,
  generateCertificatePDFStream,
};
