import { prisma } from '../../config/prisma.js';

export const documentsService = {
  async getMyDocuments({ employeeId, filters = {}, pagination = { page: 1, limit: 20 } }) {
    const where = { employeeId };

    if (filters.status) where.status = filters.status;
    if (filters.documentTypeId) where.documentTypeId = filters.documentTypeId;
    if (filters.type) {
      where.documentType = {
        name: { equals: filters.type, mode: 'insensitive' }
      };
    }
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }
    if (filters.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { documentType: { name: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 20;

    const [documents, total] = await Promise.all([
      prisma.employeeDocument.findMany({
        where,
        include: {
          documentType: { select: { id: true, name: true } },
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.employeeDocument.count({ where })
    ]);

    return {
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  async listDocumentsByCompany(companyId, filters = {}) {
    const where = {
      employee: { companyId }
    };
    if (filters.status) where.status = filters.status;
    if (filters.documentTypeId) where.documentTypeId = filters.documentTypeId;
    if (filters.employeeIds && Array.isArray(filters.employeeIds)) {
      where.employeeId = { in: filters.employeeIds };
    } else if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters.departmentId) {
      where.employee.departmentId = filters.departmentId;
    }

    return prisma.employeeDocument.findMany({
      where,
      include: {
        documentType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async listDocumentsByEmployee(employeeId) {
    return prisma.employeeDocument.findMany({
      where: { employeeId },
      include: {
        documentType: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async getDocumentById(id) {
    return prisma.employeeDocument.findUnique({
      where: { id },
      include: {
        documentType: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true, companyId: true }
        }
      }
    });
  },

  async uploadDocument(data) {
    // Check if document is Aadhaar
    if (data.documentTypeId) {
      const docType = await prisma.documentType.findUnique({
        where: { id: data.documentTypeId }
      });
      if (docType && /aadhaar/i.test(docType.name)) {
        const err = new Error('Aadhaar must be uploaded via Aadhaar verification flow. Use /documents/aadhaar/upload');
        err.statusCode = 400;
        throw err;
      }
    }

    if (data.type && /aadhaar/i.test(data.type)) {
      const err = new Error('Aadhaar must be uploaded via Aadhaar verification flow. Use /documents/aadhaar/upload');
      err.statusCode = 400;
      throw err;
    }

    return prisma.employeeDocument.create({
      data: {
        employeeId: data.employeeId,
        documentTypeId: data.documentTypeId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        publicId: data.publicId || data.fileName,
        fileSize: data.fileSize ? parseInt(data.fileSize, 10) : null,
        mimeType: data.mimeType || 'application/pdf',
        format: data.format || 'PDF',
        status: 'PENDING',
        verificationMethod: 'MANUAL'
      },
      include: {
        documentType: true,
        employee: true
      }
    });
  },

  async verifyDocument(id, verifiedBy) {
    return prisma.employeeDocument.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedBy: verifiedBy || 'HR_ADMIN',
        verifiedAt: new Date(),
        rejectionReason: null
      }
    });
  },

  async rejectDocument(id, rejectionReason, verifiedBy) {
    return prisma.employeeDocument.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        verifiedBy: verifiedBy || 'HR_ADMIN',
        verifiedAt: new Date()
      }
    });
  },

  async deleteDocument(id) {
    return prisma.employeeDocument.delete({
      where: { id }
    });
  },

  async getDocumentStats(companyId) {
    try {
      const docs = await prisma.employeeDocument.findMany({
        where: { employee: { companyId } },
        select: { status: true }
      });
      const total = docs.length;
      const pending = docs.filter(d => d.status === 'PENDING').length;
      const verified = docs.filter(d => d.status === 'VERIFIED').length;
      const rejected = docs.filter(d => d.status === 'REJECTED').length;
      return { total, pending, verified, rejected };
    } catch (err) {
      return { total: 0, pending: 0, verified: 0, rejected: 0 };
    }
  },

  async listDocumentTypes(companyId) {
    return prisma.documentType.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  },

  async createDocumentType(companyId, data) {
    return prisma.documentType.create({
      data: {
        companyId,
        name: data.name,
        isMandatory: data.isMandatory || false,
        isActive: true
      }
    });
  },

  async getDownloadUrl(id) {
    const doc = await this.getDocumentById(id);
    if (!doc) {
      return {
        downloadUrl: `https://storage.googleapis.com/ems-docs/doc_${id}.pdf`,
        fileName: `document_${id}.pdf`
      };
    }
    return {
      downloadUrl: doc.fileUrl || `https://storage.googleapis.com/ems-docs/${doc.fileName}`,
      fileName: doc.fileName
    };
  }
};

export default documentsService;
