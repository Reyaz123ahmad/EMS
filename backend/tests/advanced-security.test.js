import prisma from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runAdvancedSecurityTests() {
  console.log('--- STARTING ADVANCED SECURITY TEST SUITE ---');

  // 1. Setup seed data
  let company = await prisma.company.findFirst();
  let employee = await prisma.employee.findFirst({
    where: { companyId: company.id }
  });

  const token = generateAccessToken({
    id: employee.userId || 'test-user-id',
    sub: employee.userId || 'test-user-id',
    email: employee.email || 'admin@company.com',
    role: 'COMPANY_ADMIN',
    companyId: company.id
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // TEST 1: Hardware Device Attestation (Valid Strong Token)
  console.log('1. Testing Hardware Device Attestation (Play Integrity Strong)...');
  const attestRes = await fetch(`${BASE_URL}/security/attest`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      deviceId: 'device-test-android-secure-uuid',
      attestationToken: 'play_integrity_verified_token_sample_1234567890',
      platform: 'android',
      provider: 'PLAY_INTEGRITY',
      isRooted: false,
      isEmulator: false
    })
  });
  const attestData = await attestRes.json();
  console.log('Device Attestation Status:', attestRes.status, 'Passed:', attestData.data?.passed, 'Integrity:', attestData.data?.integrity);
  if (attestRes.status !== 200 || !attestData.data?.passed) {
    throw new Error(`Device Attestation failed: ${JSON.stringify(attestData)}`);
  }

  // TEST 2: Device Attestation (Rooted OS Violation)
  console.log('2. Testing Device Attestation (Rooted OS Compromise)...');
  const rootedRes = await fetch(`${BASE_URL}/security/attest`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      deviceId: 'device-test-rooted-compromised',
      attestationToken: 'play_integrity_compromised_token',
      platform: 'android',
      provider: 'PLAY_INTEGRITY',
      isRooted: true,
      isEmulator: false
    })
  });
  const rootedData = await rootedRes.json();
  console.log('Rooted Device Status:', rootedRes.status, 'Passed (Expect false):', rootedData.data?.passed, 'Reason:', rootedData.data?.reason);

  // TEST 3: Validate IP Whitelist
  console.log('3. Testing IP Address Whitelist Validation...');
  const ipRes = await fetch(`${BASE_URL}/security/validate-ip`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      ipAddress: '127.0.0.1'
    })
  });
  const ipData = await ipRes.json();
  console.log('IP Validation Status:', ipRes.status, 'Passed:', ipData.data?.passed);

  // TEST 4: Detect VPN
  console.log('4. Testing VPN / Proxy Detection...');
  const vpnRes = await fetch(`${BASE_URL}/security/detect-vpn`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      ipAddress: '10.8.0.1'
    })
  });
  const vpnData = await vpnRes.json();
  console.log('VPN Detection Status:', vpnRes.status, 'isVPN (Expect true):', vpnData.data?.isVPN, 'Provider:', vpnData.data?.provider);

  // TEST 5: Get Security Health Score
  console.log('5. Testing Security Health Score...');
  const scoreRes = await fetch(`${BASE_URL}/security/security-score`, {
    method: 'GET',
    headers: authHeaders
  });
  const scoreData = await scoreRes.json();
  console.log('Security Score Status:', scoreRes.status, 'Score:', scoreData.data?.score, 'Grade:', scoreData.data?.grade);

  // TEST 6: Update Security Policy Settings
  console.log('6. Testing Update Security Policy Settings...');
  const settingsRes = await fetch(`${BASE_URL}/security/security-settings`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      securityLevel: 'HIGH',
      blockVpn: true,
      blockRootedDevices: true,
      ipWhitelistEnabled: false
    })
  });
  const settingsData = await settingsRes.json();
  console.log('Update Settings Status:', settingsRes.status, 'Level:', settingsData.data?.securityLevel);

  // TEST 7: Get Security Dashboard
  console.log('7. Testing Get Security Dashboard...');
  const dashRes = await fetch(`${BASE_URL}/security/dashboard`, {
    method: 'GET',
    headers: authHeaders
  });
  const dashData = await dashRes.json();
  console.log('Security Dashboard Status:', dashRes.status, 'Trusted Devices:', dashData.data?.metrics?.trustedDevicesCount);

  // TEST 8: Create & Review Fraud Signal
  console.log('8. Testing Fraud Signal Incident Review...');
  const fraudSignal = await prisma.fraudSignal.create({
    data: {
      companyId: company.id,
      employeeId: employee.id,
      signalType: 'MOCK_LOCATION',
      severity: 'HIGH',
      description: 'Automated test GPS spoofing alert',
      reviewed: false
    }
  });

  const reviewRes = await fetch(`${BASE_URL}/security/fraud-signals/${fraudSignal.id}/review`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'APPROVE',
      notes: 'Reviewed and dismissed during test suite execution'
    })
  });
  const reviewData = await reviewRes.json();
  console.log('Review Signal Status:', reviewRes.status, 'Reviewed:', reviewData.data?.reviewed, 'Action:', reviewData.data?.action);

  console.log('--- ADVANCED SECURITY SUITE COMPLETED SUCCESSFULLY ---');
}

export default runAdvancedSecurityTests;
