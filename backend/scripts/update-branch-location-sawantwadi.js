import { prisma } from '../src/config/prisma.js';

async function updateBranchAndSettings() {
  console.log('=== STEP 1: UPDATING BRANCH LOCATION ===');
  const branch = await prisma.branch.update({
    where: { id: 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7' },
    data: {
      latitude: 15.89659559270298,
      longitude: 73.81949,
      address: 'Sawantwadi, Maharashtra',
      city: 'Sawantwadi',
      state: 'Maharashtra',
      country: 'India'
    }
  });

  console.log('Branch updated:');
  console.log('Latitude:', branch.latitude);
  console.log('Longitude:', branch.longitude);
  console.log('City:', branch.city);
  console.log('State:', branch.state);
  console.log('Address:', branch.address);
  console.log('Radius:', branch.geofenceRadius);

  console.log('\n=== STEP 2: UPDATING COMPANY maxAccuracy ===');
  const company = await prisma.company.findUnique({
    where: { id: '925af98c-24d1-4f9f-8f87-97a55734c7cd' }
  });

  const settings = company.attendanceSettings || {};
  settings.geoFencing = settings.geoFencing || {};
  settings.geoFencing.maxAccuracy = 500;

  const updatedCompany = await prisma.company.update({
    where: { id: '925af98c-24d1-4f9f-8f87-97a55734c7cd' },
    data: { attendanceSettings: settings }
  });

  console.log('maxAccuracy updated in attendanceSettings:');
  console.log(JSON.stringify(updatedCompany.attendanceSettings, null, 2));

  console.log('\n=== STEP 3: VERIFICATION FROM DB ===');
  const checkBranch = await prisma.branch.findUnique({
    where: { id: 'f74c6719-d57a-4237-9a61-85fa9e9c7dc7' }
  });

  const checkCompany = await prisma.company.findUnique({
    where: { id: '925af98c-24d1-4f9f-8f87-97a55734c7cd' }
  });

  console.log('=== BRANCH RECORD ===');
  console.log('ID:', checkBranch.id);
  console.log('Latitude:', checkBranch.latitude);
  console.log('Longitude:', checkBranch.longitude);
  console.log('City:', checkBranch.city);
  console.log('State:', checkBranch.state);
  console.log('Address:', checkBranch.address);
  console.log('Radius:', checkBranch.geofenceRadius);

  console.log('\n=== COMPANY SETTINGS ===');
  console.log('maxAccuracy:', checkCompany.attendanceSettings?.geoFencing?.maxAccuracy);

  await prisma.$disconnect();
}

updateBranchAndSettings().catch(console.error);
