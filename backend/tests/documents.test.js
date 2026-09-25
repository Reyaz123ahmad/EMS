import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runDocumentTests(companyId, employeeId) {
  console.log('\n--- [4/5] STARTING DOCUMENTS MODULE TEST SUITE ---');

  let adminUser = await prisma.user.findFirst({
    where: { companyId, status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!adminUser) {
    adminUser = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
  }

  const effectiveCompanyId = companyId || adminUser.companyId;

  // Find or create an employee for this company
  let targetEmployee = null;
  if (employeeId) {
    targetEmployee = await prisma.employee.findUnique({ where: { id: employeeId } });
  }
  if (!targetEmployee) {
    targetEmployee = await prisma.employee.findFirst({
      where: { companyId: effectiveCompanyId }
    });
  }
  if (!targetEmployee) {
    targetEmployee = await prisma.employee.create({
      data: {
        companyId: effectiveCompanyId,
        firstName: 'TestDoc',
        lastName: 'Employee',
        email: `doc_emp_${Date.now()}@test.com`,
        phone: `+9198${Date.now().toString().slice(-8)}`,
        employeeCode: `DOC${Date.now().toString().slice(-4)}`,
        status: 'ACTIVE'
      }
    });
  }

  // Find or create a documentType for this company
  let docType = await prisma.documentType.findFirst({
    where: { companyId: effectiveCompanyId }
  });
  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        companyId: effectiveCompanyId,
        name: 'National ID / Passport',
        isMandatory: false,
        isActive: true
      }
    });
  }

  const token = generateAccessToken({
    id: adminUser.id,
    sub: adminUser.id,
    userId: adminUser.id,
    email: adminUser.email,
    role: 'COMPANY_ADMIN',
    companyId: effectiveCompanyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const suffix = Date.now();

  // Create directly via prisma or endpoint
  console.log('1. Testing Document Database Record Creation...');
  const createdDoc = await prisma.employeeDocument.create({
    data: {
      employeeId: targetEmployee.id,
      documentTypeId: docType.id,
      fileName: `passport_scan_${suffix}.pdf`,
      fileUrl: `https://storage.googleapis.com/ems-docs/passport_${suffix}.pdf`,
      publicId: `ems_docs/passport_${suffix}`,
      fileSize: 1048576,
      mimeType: 'application/pdf',
      format: 'PDF',
      status: 'PENDING'
    }
  });
  console.log('Created Employee Document ID:', createdDoc.id, 'Status:', createdDoc.status);

  // 2. Verify Document
  console.log('2. Testing POST /api/v1/documents/:id/verify...');
  const verifyRes = await fetch(`${BASE_URL}/documents/${createdDoc.id}/verify`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ verifiedNotes: 'Audited and approved by HR Compliance' })
  });
  const verifyData = await verifyRes.json();
  console.log('Verify Document Status:', verifyRes.status, 'New Status:', verifyData.data?.document?.status);
  if (verifyRes.status !== 200 || verifyData.data?.document?.status !== 'VERIFIED') {
    throw new Error(`Verify document failed: ${JSON.stringify(verifyData)}`);
  }

  // 3. Document Stats
  console.log('3. Testing GET /api/v1/documents/stats...');
  const statsRes = await fetch(`${BASE_URL}/documents/stats`, { headers: authHeaders });
  const statsData = await statsRes.json();
  console.log('Document Stats Status:', statsRes.status, 'Total Docs:', statsData.data?.total);
  if (statsRes.status !== 200) {
    throw new Error(`Document stats failed: ${JSON.stringify(statsData)}`);
  }

  // 4. Download Document signed URL
  console.log('4. Testing GET /api/v1/documents/:id/download...');
  const downloadRes = await fetch(`${BASE_URL}/documents/${createdDoc.id}/download`, { headers: authHeaders });
  const downloadData = await downloadRes.json();
  console.log('Download Document Status:', downloadRes.status, 'URL:', downloadData.data?.downloadUrl);
  if (downloadRes.status !== 200 || !downloadData.data?.downloadUrl) {
    throw new Error(`Download document failed: ${JSON.stringify(downloadData)}`);
  }

  console.log('✅ ALL DOCUMENT MODULE TESTS PASSED');
  return { docId: createdDoc.id };
}

export default runDocumentTests;

