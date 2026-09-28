import documentsService from './documents.service.js';
import aadhaarService from './aadhaar.service.js';
import { prisma } from '../../config/prisma.js';
import { getAuthEmployeeId, getAuthEmployee, getManagerTeamIds } from '../../security/data-scope.js';

async function resolveEmployeeId(req) {
  const role = req.user?.role || 'EMPLOYEE';
  if (role === 'EMPLOYEE' || role === 'MANAGER' || role === 'HR_MANAGER') {
    return await getAuthEmployeeId(req);
  }
  if (req.body.employeeId) return req.body.employeeId;
  return await getAuthEmployeeId(req);
}

export const documentsController = {
  async getMyDocuments(req, res, next) {
    try {
      const employeeId = await getAuthEmployeeId(req);
      if (!employeeId) {
        return res.status(404).json({ status: 'error', success: false, message: 'Employee profile not found' });
      }

      const result = await documentsService.getMyDocuments({
        employeeId,
        filters: req.query,
        pagination: {
          page: parseInt(req.query.page, 10) || 1,
          limit: parseInt(req.query.limit, 10) || 20
        }
      });

      res.status(200).json({ status: 'ok', success: true, message: 'My documents retrieved', data: result, documents: result.documents, ...result });
    } catch (err) {
      next(err);
    }
  },

  async listByCompany(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const companyId = req.user.companyId;
      const filters = { ...req.query };

      if (role === 'EMPLOYEE') {
        filters.employeeId = await getAuthEmployeeId(req);
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        filters.employeeIds = await getManagerTeamIds(emp?.id);
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (emp?.departmentId) filters.departmentId = emp.departmentId;
      }

      const documents = await documentsService.listDocumentsByCompany(companyId, filters);
      res.status(200).json({ status: 'ok', success: true, data: { documents }, documents });
    } catch (err) {
      next(err);
    }
  },

  async listByEmployee(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const { employeeId } = req.params;

      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (employeeId !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own documents' });
        }
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (!teamIds.includes(employeeId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Employee is outside your team' });
        }
      }

      const documents = await documentsService.listDocumentsByEmployee(employeeId);
      res.status(200).json({ status: 'ok', data: { documents } });
    } catch (err) {
      next(err);
    }
  },

  async get(req, res, next) {
    try {
      const role = req.user?.role || 'EMPLOYEE';
      const { id } = req.params;
      const document = await documentsService.getDocumentById(id);
      if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });

      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        if (document.employeeId !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only view your own documents' });
        }
      } else if (role === 'MANAGER') {
        const emp = await getAuthEmployee(req);
        const teamIds = await getManagerTeamIds(emp?.id);
        if (!teamIds.includes(document.employeeId)) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Document belongs outside your team' });
        }
      } else if (role === 'HR_MANAGER') {
        const emp = await getAuthEmployee(req);
        if (document.employee?.departmentId && emp?.departmentId && document.employee.departmentId !== emp.departmentId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: Document belongs to a different department' });
        }
      }

      res.status(200).json({ status: 'ok', data: { document } });
    } catch (err) {
      next(err);
    }
  },

  async upload(req, res, next) {
    try {
      const companyId = req.user?.companyId;
      let employeeId = await resolveEmployeeId(req);
      if (!employeeId && companyId) {
        const emp = await prisma.employee.findFirst({ where: { companyId } });
        employeeId = emp?.id;
      }

      if (!employeeId) {
        return res.status(404).json({ status: 'error', message: 'Employee record not found. Contact HR.' });
      }

      let documentTypeId = req.body.documentTypeId;
      if (!documentTypeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentTypeId)) {
        const typeName = req.body.type || req.body.title || 'General';
        let docType = await prisma.documentType.findFirst({
          where: { companyId, name: { equals: typeName, mode: 'insensitive' } }
        });
        if (!docType) {
          docType = await prisma.documentType.create({
            data: { companyId, name: typeName }
          });
        }
        documentTypeId = docType.id;
      }

      const file = req.file;
      const payload = {
        ...req.body,
        employeeId,
        documentTypeId,
        fileName: file ? file.originalname : req.body.fileName || req.body.title || 'Document',
        fileUrl: req.body.fileUrl || (file ? `https://storage.ems.local/documents/${file.originalname}` : 'https://storage.ems.local/documents/sample.pdf'),
        fileSize: file ? file.size : (req.body.fileSize ? parseInt(req.body.fileSize, 10) : 1024),
        mimeType: file ? file.mimetype : req.body.mimeType || 'application/pdf',
        format: file ? (file.mimetype?.split('/')[1]?.toUpperCase() || 'PDF') : req.body.format || 'PDF',
        publicId: req.body.publicId || (file ? `doc_${Date.now()}_${file.originalname}` : `doc_${Date.now()}`)
      };

      const document = await documentsService.uploadDocument(payload);
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
      const role = req.user?.role || 'EMPLOYEE';
      if (role === 'EMPLOYEE') {
        const authEmpId = await getAuthEmployeeId(req);
        const doc = await documentsService.getDocumentById(id);
        if (!doc) return res.status(404).json({ status: 'error', message: 'Document not found' });
        if (doc.employeeId !== authEmpId) {
          return res.status(403).json({ status: 'error', message: 'Access denied: You can only delete your own documents' });
        }
      }
      await documentsService.deleteDocument(id);
      res.status(200).json({ status: 'ok', success: true, message: 'Document deleted successfully' });
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
