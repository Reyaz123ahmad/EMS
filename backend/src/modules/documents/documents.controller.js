import documentsService from './documents.service.js';
import aadhaarService from './aadhaar.service.js';
import { prisma } from '../../config/prisma.js';

async function resolveEmployeeId(req) {
  if (req.body.employeeId) return req.body.employeeId;
  if (req.user?.employeeId) return req.user.employeeId;
  const emp = await prisma.employee.findFirst({
    where: { userId: req.user.id }
  });
  return emp ? emp.id : null;
}

export const documentsController = {
  async listByCompany(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const documents = await documentsService.listDocumentsByCompany(companyId, req.query);
      res.status(200).json({ status: 'ok', data: { documents } });
    } catch (err) {
      next(err);
    }
  },

  async listByEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;
      const documents = await documentsService.listDocumentsByEmployee(employeeId);
      res.status(200).json({ status: 'ok', data: { documents } });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentsService.getDocumentById(id);
      if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });
      res.status(200).json({ status: 'ok', data: { document } });
    } catch (err) {
      next(err);
    }
  },

  async upload(req, res, next) {
    try {
      const document = await documentsService.uploadDocument(req.body);
      res.status(201).json({ status: 'ok', data: { document } });
    } catch (err) {
      next(err);
    }
  },

  async verify(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentsService.verifyDocument(id, req.user?.id);
      res.status(200).json({ status: 'ok', message: 'Document verified successfully', data: { document } });
    } catch (err) {
      next(err);
    }
  },

  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const document = await documentsService.rejectDocument(id, rejectionReason || 'Document unreadable or invalid', req.user?.id);
      res.status(200).json({ status: 'ok', message: 'Document rejected', data: { document } });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await documentsService.deleteDocument(id);
      res.status(200).json({ status: 'ok', message: 'Document deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getStats(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const stats = await documentsService.getDocumentStats(companyId);
      res.status(200).json({ status: 'ok', data: { stats } });
    } catch (err) {
      next(err);
    }
  },

  async listTypes(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const types = await documentsService.listDocumentTypes(companyId);
      res.status(200).json({ status: 'ok', data: { documentTypes: types } });
    } catch (err) {
      next(err);
    }
  },

  async createType(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const type = await documentsService.createDocumentType(companyId, req.body);
      res.status(201).json({ status: 'ok', data: { documentType: type } });
    } catch (err) {
      next(err);
    }
  },

  async download(req, res, next) {
    try {
      const { id } = req.params;
      const result = await documentsService.getDownloadUrl(id);
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  // ================= Aadhaar Specific Actions =================

  async getAadhaarMode(req, res, next) {
    try {
      const result = aadhaarService.getMode();
      res.status(200).json({ status: 'ok', data: result });
    } catch (err) {
      next(err);
    }
  },

  async sendAadhaarOTP(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const employeeId = await resolveEmployeeId(req);

      if (!employeeId) {
        return res.status(400).json({ status: 'error', message: 'Employee profile not found' });
      }

      const { aadhaarNumber, name, consent } = req.body;
      const result = await aadhaarService.sendAadhaarOTP({
        employeeId,
        companyId,
        aadhaarNumber,
        name,
        consent: consent !== false
      });

      res.status(200).json({ status: 'ok', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  },

  async verifyAadhaarOTP(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const employeeId = await resolveEmployeeId(req);

      if (!employeeId) {
        return res.status(400).json({ status: 'error', message: 'Employee profile not found' });
      }

      const { transactionId, otp, aadhaarNumber } = req.body;
      const result = await aadhaarService.verifyAadhaarOTP({
        employeeId,
        companyId,
        transactionId,
        otp,
        aadhaarNumber
      });

      res.status(200).json({ status: 'ok', message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  },

  async uploadAadhaar(req, res, next) {
    try {
      const companyId = req.user.companyId;
      const employeeId = await resolveEmployeeId(req);

      if (!employeeId) {
        return res.status(400).json({ status: 'error', message: 'Employee profile not found' });
      }

      const { transactionId, documentTypeId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ status: 'error', message: 'Aadhaar document file is required' });
      }

      const document = await aadhaarService.uploadAadhaarDocument({
        employeeId,
        companyId,
        file,
        transactionId,
        documentTypeId,
        userId: req.user.id,
        ipAddress: req.ip || req.connection?.remoteAddress
      });

      res.status(201).json({ status: 'ok', message: 'Aadhaar document uploaded successfully', data: { document } });
    } catch (err) {
      next(err);
    }
  }
};

export default documentsController;
