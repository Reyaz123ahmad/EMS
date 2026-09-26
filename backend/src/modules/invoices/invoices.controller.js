import invoicesService from './invoices.service.js';
import { successResponse } from '../../utils/response.js';

export async function listInvoices(req, res, next) {
  try {
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? req.query.companyId : (req.user?.companyId || req.user?.company?.id);

    const result = await invoicesService.listInvoices(companyId, req.query, {
      page: req.query.page,
      limit: req.query.limit
    });

    return successResponse(res, result.invoices, 'Invoices retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getInvoiceById(req, res, next) {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? null : (req.user?.companyId || req.user?.company?.id);

    const invoice = await invoicesService.getInvoiceById(id, companyId);
    return successResponse(res, invoice, 'Invoice retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function downloadInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? null : (req.user?.companyId || req.user?.company?.id);

    const invoiceData = await invoicesService.generateInvoicePDF(id, companyId);
    return successResponse(res, invoiceData, 'Invoice PDF generated successfully');
  } catch (err) {
    next(err);
  }
}

export async function sendInvoiceEmail(req, res, next) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const isSuperAdmin = req.user?.roles?.includes('SUPER_ADMIN') || req.user?.role === 'SUPER_ADMIN';
    const companyId = isSuperAdmin ? null : (req.user?.companyId || req.user?.company?.id);

    const result = await invoicesService.sendInvoiceEmail(id, email, companyId);
    return successResponse(res, result, 'Invoice email sent successfully');
  } catch (err) {
    next(err);
  }
}

export default {
  listInvoices,
  getInvoiceById,
  downloadInvoice,
  sendInvoiceEmail
};
