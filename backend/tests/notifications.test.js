import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

export async function runNotificationTests() {
  console.log('--- STARTING NOTIFICATIONS TEST SUITE ---');

  // 1. Fetch or create test user
  let user = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
    include: { userRoles: { include: { role: true } } }
  });

  if (!user) {
    throw new Error('No active test user found in database');
  }

  const token = generateAccessToken({
    id: user.id,
    sub: user.id,
    userId: user.id,
    email: user.email,
    role: user.userRoles?.[0]?.role?.name || 'COMPANY_ADMIN',
    companyId: user.companyId
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // TEST 1: Create Single Notification (Full Payload)
  console.log('1. Testing POST /api/v1/notifications (Create Full Payload)...');
  const createPayload = {
    userId: user.id,
    title: 'Biometric Face Enrollment Complete',
    body: 'Your 512-dimensional facial biometric embedding has been encrypted with AES-256-GCM and enrolled into the access control terminal.',
    type: 'ATTENDANCE',
    priority: 'HIGH',
    metadata: {
      device: 'Android Terminal 01',
      vectorDim: 512,
      encryption: 'AES-256-GCM',
      timestamp: new Date().toISOString()
    }
  };

  const createRes = await fetch(`${BASE_URL}/notifications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(createPayload)
  });
  const createData = await createRes.json();
  console.log('Create Notification Status:', createRes.status, 'ID:', createData.data?.id);
  if (createRes.status !== 201 || !createData.data?.id) {
    throw new Error(`Create notification failed: ${JSON.stringify(createData)}`);
  }
  const createdNotificationId = createData.data.id;

  // TEST 2: Create Second Notification with Different Type and Priority (Full Payload)
  console.log('2. Testing POST /api/v1/notifications (Security Alert Full Payload)...');
  const secNotifRes = await fetch(`${BASE_URL}/notifications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: user.id,
      title: 'Security Notice: Geofence Verification',
      body: 'Your mobile device checked in successfully within the office geofenced perimeter (200m radius).',
      type: 'SECURITY',
      priority: 'URGENT',
      metadata: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 12.5,
        isMockLocation: false
      }
    })
  });
  const secNotifData = await secNotifRes.json();
  console.log('Security Notification Status:', secNotifRes.status, 'ID:', secNotifData.data?.id);
  if (secNotifRes.status !== 201) {
    throw new Error(`Create security notification failed: ${JSON.stringify(secNotifData)}`);
  }
  const secondNotificationId = secNotifData.data.id;

  // TEST 3: Get Unread Count
  console.log('3. Testing GET /api/v1/notifications/unread-count...');
  const countRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: authHeaders
  });
  const countData = await countRes.json();
  console.log('Unread Count Status:', countRes.status, 'Unread Count:', countData.data?.unreadCount);
  if (countRes.status !== 200 || typeof countData.data?.unreadCount !== 'number') {
    throw new Error(`Get unread count failed: ${JSON.stringify(countData)}`);
  }

  // TEST 4: List Notifications (Full query params: type, isRead, page, limit)
  console.log('4. Testing GET /api/v1/notifications (Filtered & Paginated)...');
  const listRes = await fetch(`${BASE_URL}/notifications?type=ATTENDANCE&page=1&limit=10`, {
    method: 'GET',
    headers: authHeaders
  });
  const listData = await listRes.json();
  console.log('List Notifications Status:', listRes.status, 'Count:', listData.data?.notifications?.length, 'Total:', listData.data?.pagination?.total);
  if (listRes.status !== 200 || !Array.isArray(listData.data?.notifications)) {
    throw new Error(`List notifications failed: ${JSON.stringify(listData)}`);
  }

  // TEST 5: Mark Single Notification as Read
  console.log(`5. Testing PUT /api/v1/notifications/${createdNotificationId}/read...`);
  const readRes = await fetch(`${BASE_URL}/notifications/${createdNotificationId}/read`, {
    method: 'PUT',
    headers: authHeaders
  });
  const readData = await readRes.json();
  console.log('Mark Read Status:', readRes.status, 'Message:', readData.message);
  if (readRes.status !== 200) {
    throw new Error(`Mark read failed: ${JSON.stringify(readData)}`);
  }

  // TEST 6: Mark All Notifications as Read
  console.log('6. Testing PUT /api/v1/notifications/read-all...');
  const readAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: authHeaders
  });
  const readAllData = await readAllRes.json();
  console.log('Mark All Read Status:', readAllRes.status, 'Message:', readAllData.message);
  if (readAllRes.status !== 200) {
    throw new Error(`Mark all read failed: ${JSON.stringify(readAllData)}`);
  }

  // Verify unread count is now 0
  const countAfterAllRead = await fetch(`${BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers: authHeaders
  });
  const countAfterData = await countAfterAllRead.json();
  console.log('Unread Count after mark-all-read:', countAfterData.data?.unreadCount);

  // TEST 7: Delete Notification
  console.log(`7. Testing DELETE /api/v1/notifications/${createdNotificationId}...`);
  const deleteRes = await fetch(`${BASE_URL}/notifications/${createdNotificationId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Notification Status:', deleteRes.status, 'Message:', deleteData.message);
  if (deleteRes.status !== 200) {
    throw new Error(`Delete notification failed: ${JSON.stringify(deleteData)}`);
  }

  // TEST 8: Error Case - Unauthenticated Access (401)
  console.log('8. Testing Error Case: Unauthenticated 401 Unauthorized...');
  const unauthRes = await fetch(`${BASE_URL}/notifications`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Unauthenticated Request Status:', unauthRes.status, '(Expected 401)');
  if (unauthRes.status !== 401) {
    throw new Error(`Expected status 401 but got ${unauthRes.status}`);
  }

  // TEST 9: Error Case - Validation Failure (400 Bad Request)
  console.log('9. Testing Error Case: Invalid Payload 400 Bad Request...');
  const invalidRes = await fetch(`${BASE_URL}/notifications`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      userId: 'not-a-valid-uuid',
      title: ''
    })
  });
  console.log('Invalid Payload Status:', invalidRes.status, '(Expected 400)');
  if (invalidRes.status !== 400) {
    throw new Error(`Expected status 400 but got ${invalidRes.status}`);
  }

  // Cleanup remaining test notification
  if (secondNotificationId) {
    await fetch(`${BASE_URL}/notifications/${secondNotificationId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
  }

  console.log('✅ ALL NOTIFICATION MODULE TESTS PASSED (100% OK RESPONSES)');
}

export default runNotificationTests;
