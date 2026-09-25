import documentsService from './documents.service.js';

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
  }
};

export default documentsController;
