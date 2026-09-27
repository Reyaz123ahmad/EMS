import { prisma } from '../src/config/prisma.js';
import { generateAccessToken } from '../src/security/jwt.js';

async function testAttendanceCheckin() {
  console.log('=== TEST ATTENDANCE CHECK-IN AT SAWANTWADI ===\n');

  const branchId = 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7';
  const companyId = '925af98c-24d1-4f9f-8f87-97a55734c7cd';

  // 1. Get branch info
  const branch = await prisma.branch.findUnique({
    where: { id: branchId }
  });
  console.log('Branch info:', {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    state: branch.state,
    lat: branch.latitude,
    lng: branch.longitude,
    radius: branch.geofenceRadius
  });

  // 2. Get employee in this company
  const employee = await prisma.employee.findFirst({
    where: { companyId },
    include: { user: true }
  });

  if (!employee) {
    console.error('No employee found for company:', companyId);
    return;
  }

  console.log('Found employee:', {
    id: employee.id,
    code: employee.employeeCode,
    email: employee.user.email
  });

  // Ensure employee is assigned to this branch
  await prisma.employee.update({
    where: { id: employee.id },
    data: { branchId: branch.id }
  });

  // Ensure employee has an active card for CARD attendance mode testing
  let card = await prisma.employeeCard.findFirst({
    where: { employeeId: employee.id, isActive: true }
  });

  if (!card) {
    card = await prisma.employeeCard.create({
      data: {
        companyId,
        employeeId: employee.id,
        cardNumber: `CARD-${Date.now().toString().slice(-6)}`,
        cardType: 'RFID',
        isActive: true
      }
    });
    console.log('Created test employee card:', card.cardNumber);
  } else {
    console.log('Found active employee card:', card.cardNumber);
  }

  const token = generateAccessToken({
    id: employee.userId,
    email: employee.user.email,
    companyId: employee.companyId,
    role: 'EMPLOYEE'
  });

  // 3. Clear today's logs for fresh check-in test
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.attendanceLog.deleteMany({
    where: {
      employeeId: employee.id,
      attendanceDate: { gte: today }
    }
  });

  // 4. Perform check-in at Sawantwadi coordinates (lat: 15.89659559270298, lng: 73.81949)
  const checkinPayload = {
    mode: 'CARD',
    cardNumber: card.cardNumber,
    location: {
      lat: 15.89659559270298,
      lng: 73.81949,
      accuracy: 25,
      source: 'gps'
    },
    deviceInfo: {
      isMockLocation: false,
      platform: 'web',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  };

  console.log('\nSubmitting check-in with coordinates:');
  console.log(JSON.stringify(checkinPayload, null, 2));

  const res = await fetch('http://localhost:5000/api/v1/attendance/check-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(checkinPayload)
  });

  const data = await res.json();
  console.log('\nCheck-in response status:', res.status);
  console.log('Check-in response data:', JSON.stringify(data, null, 2));

  if (res.status === 200 || res.status === 201) {
    console.log('\n✅ ATTENDANCE CHECK-IN TEST: PASS');
  } else {
    console.log('\n❌ ATTENDANCE CHECK-IN TEST: FAIL');
  }

  await prisma.$disconnect();
}

testAttendanceCheckin().catch(console.error);
