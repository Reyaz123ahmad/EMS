import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function testAllThreeBugs() {
  console.log('====================================================');
  console.log('       VERIFYING 3 CRITICAL FIXES ACROSS ROLES      ');
  console.log('====================================================\n');

  // 1. Super Admin Authentication
  console.log('▶ 1. Logging in as SUPER_ADMIN (reyazahmadmath@gmail.com)...');
  const saLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reyazahmadmath@gmail.com', password: 'Reyaz123@_Ahmad' })
  });
  const saLoginData = await saLoginRes.json();
  const saToken = saLoginData.data?.accessToken;
  console.log('  ✓ Super Admin login:', saLoginRes.status === 200 ? 'SUCCESS' : 'FAILED');

  // Test Bug 1: Super Admin Notifications
  console.log('\n▶ 2. Testing Bug 1: Super Admin Notifications APIs...');
  const saNotifRes = await fetch(`${BASE_URL}/notifications?page=1&limit=5`, {
    headers: { 'Authorization': `Bearer ${saToken}` }
  });
  const saNotifData = await saNotifRes.json();
  console.log('  - GET /notifications status:', saNotifRes.status, saNotifRes.status === 200 ? '✓ PASS' : '✗ FAIL');

  const saUnreadRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
    headers: { 'Authorization': `Bearer ${saToken}` }
  });
  const saUnreadData = await saUnreadRes.json();
  console.log('  - GET /notifications/unread-count status:', saUnreadRes.status, saUnreadRes.status === 200 ? '✓ PASS' : '✗ FAIL');

  // Test Bug 2: Super Admin Socket.io Auth
  console.log('\n▶ 3. Testing Bug 2: Super Admin Socket.io Connection...');
  const saSocketConnected = await new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: saToken },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('  ✓ Socket connected successfully! Socket ID:', socket.id);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      console.error('  ✗ Socket connection error:', err.message);
      socket.disconnect();
      resolve(false);
    });
  });

  // Test Bug 3: Super Admin Dashboard Prisma Query
  console.log('\n▶ 4. Testing Bug 3: Super Admin Dashboard API & Prisma query...');
  const saDashRes = await fetch(`${BASE_URL}/dashboard/super-admin`, {
    headers: { 'Authorization': `Bearer ${saToken}` }
  });
  const saDashData = await saDashRes.json();
  console.log('  - GET /dashboard/super-admin status:', saDashRes.status, saDashRes.status === 200 ? '✓ PASS' : '✗ FAIL');
  if (saDashRes.status === 200) {
    const recentComp = saDashData.data?.recentCompanies || [];
    console.log(`  ✓ Loaded ${recentComp.length} recent companies with subscription plan:`, recentComp[0]?.subscription?.plan?.name || 'TRIAL');
  }

  // 5. Verify Company Admin
  console.log('\n▶ 5. Verifying Company Admin (admin@mindstocs.com)...');
  const caLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mindstocs.com', password: 'Test@123456' })
  });
  const caLoginData = await caLoginRes.json();
  const caToken = caLoginData.data?.accessToken;

  const caDashRes = await fetch(`${BASE_URL}/dashboard/company-admin`, {
    headers: { 'Authorization': `Bearer ${caToken}` }
  });
  console.log('  - Company Admin Dashboard status:', caDashRes.status, caDashRes.status === 200 ? '✓ PASS' : '✗ FAIL');

  const caNotifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${caToken}` }
  });
  console.log('  - Company Admin Notifications status:', caNotifRes.status, caNotifRes.status === 200 ? '✓ PASS' : '✗ FAIL');

  const caSocketConnected = await new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token: caToken },
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('  ✓ Company Admin Socket connected! Socket ID:', socket.id);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      console.error('  ✗ Company Admin Socket error:', err.message);
      socket.disconnect();
      resolve(false);
    });
  });

  console.log('\n====================================================');
  console.log('                  FINAL RESULTS                     ');
  console.log('====================================================');
  console.log('1. Super Admin Dashboard (Prisma fix)  :', saDashRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('2. Super Admin Notifications (403 fix) :', saNotifRes.status === 200 ? 'PASS' : 'FAIL');
  console.log('3. Super Admin Socket.io (Auth fix)    :', saSocketConnected ? 'PASS' : 'FAIL');
  console.log('4. Company Admin Everything            :', (caDashRes.status === 200 && caNotifRes.status === 200 && caSocketConnected) ? 'PASS' : 'FAIL');
  console.log('====================================================\n');
}

testAllThreeBugs().catch(console.error);
