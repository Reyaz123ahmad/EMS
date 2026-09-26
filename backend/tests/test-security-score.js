import http from 'http';
import { generateAccessToken } from '../src/security/jwt.js';

const BACKEND_URL = 'http://localhost:5000/api/v1';

async function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BACKEND_URL}${path}`);
    const reqOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        let body;
        try {
          body = JSON.parse(buffer.toString('utf-8'));
        } catch (e) {
          body = buffer.toString('utf-8');
        }
        resolve({
          status: res.statusCode,
          data: body
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function testSecurityScore() {
  console.log('Testing /api/v1/security/security-score endpoint...\n');

  const superAdminToken = generateAccessToken({
    id: 'super-admin-root-id',
    email: 'superadmin@edudibon.com',
    role: 'SUPER_ADMIN',
    companyId: null
  });

  const companyAdminToken = generateAccessToken({
    id: 'company-admin-root-id',
    email: 'admin@techcorp.com',
    role: 'COMPANY_ADMIN',
    companyId: '1432e74d-35ab-4f27-956a-4fcf11c821c9'
  });

  // 1. Super Admin test
  const saRes = await makeRequest('/security/security-score', superAdminToken);
  console.log('Super Admin response:', JSON.stringify(saRes, null, 2));

  // 2. Company Admin test
  const caRes = await makeRequest('/security/security-score', companyAdminToken);
  console.log('\nCompany Admin response:', JSON.stringify(caRes, null, 2));

  // 3. Super Admin with query params test
  const saWithParams = await makeRequest('/security/security-score?period=monthly', superAdminToken);
  console.log('\nSuper Admin with params response:', JSON.stringify(saWithParams, null, 2));

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Super Admin /security/security-score: ${saRes.status === 200 ? 'PASS' : 'FAIL'} (status ${saRes.status})`);
  console.log(`Company Admin /security/security-score: ${caRes.status === 200 ? 'PASS' : 'FAIL'} (status ${caRes.status})`);
  console.log(`No 400 Bad Request: ${saRes.status === 200 && caRes.status === 200 && saWithParams.status === 200 ? 'PASS' : 'FAIL'}`);
}

testSecurityScore();
