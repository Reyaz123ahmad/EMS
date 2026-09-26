import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken } from '../src/security/jwt.js';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

function getToken(user) {
  const roleName = user.userRoles?.[0]?.role?.name || 'EMPLOYEE';
  return generateAccessToken({
    id: user.id,
    email: user.email,
    role: roleName,
    companyId: user.companyId
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 TESTING ALL EMS DASHBOARDS & ANALYTICS ENDPOINTS');
  console.log('====================================================\n');

  // Find test users
  const superAdmin = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'SUPER_ADMIN' } } }
    },
    include: { userRoles: { include: { role: true } } }
  });

  const companyAdmin = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'COMPANY_ADMIN' } } }
    },
    include: { userRoles: { include: { role: true } } }
  });

  const hrAdmin = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'HR_ADMIN' } } }
    },
    include: { userRoles: { include: { role: true } } }
  });

  const employee = await prisma.user.findFirst({
    where: {
      userRoles: { some: { role: { name: 'EMPLOYEE' } } }
    },
    include: { userRoles: { include: { role: true } } }
  });

  const results = {
    endpointsTested: 0,
    endpointsPassed: 0,
    noNaN: true,
    noUndefined: true,
    chartsHaveRealData: true,
    trendsHaveRealPercentages: true
  };

  async function testEndpoint(name, url, user, validators = []) {
    results.endpointsTested++;
    try {
      const token = getToken(user);
      const res = await axios.get(`${API_URL}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data?.data || res.data;

      // Check for NaN or string "NaN"
      const stringified = JSON.stringify(data);
      if (stringified.includes('NaN') || stringified.includes('null') && !url.includes('client')) {
        // Some nulls might be normal (e.g. checkInTime: null when not checked in), but check for NaN
      }
      if (stringified.includes('NaN')) {
        console.error(`❌ [${name}] Returned NaN in payload!`);
        results.noNaN = false;
        return;
      }

      for (const validator of validators) {
        validator(data);
      }

      console.log(`✅ [${name}] PASS - HTTP ${res.status}`);
      results.endpointsPassed++;
    } catch (err) {
      console.error(`❌ [${name}] FAIL:`, err.response?.data?.message || err.message);
    }
  }

  // 1. Super Admin Dashboard
  if (superAdmin) {
    await testEndpoint('Super Admin Dashboard', '/dashboard/super-admin', superAdmin, [
      (d) => {
        if (!Array.isArray(d.companyGrowthTrend)) throw new Error('companyGrowthTrend is not an array');
        if (!Array.isArray(d.monthlyRevenueTrend)) throw new Error('monthlyRevenueTrend is not an array');
        if (typeof d.totalCompanies !== 'number') throw new Error('totalCompanies must be a number');
        console.log(`   ↳ Total Companies: ${d.totalCompanies}, Revenue Trend points: ${d.monthlyRevenueTrend.length}, Growth Trend points: ${d.companyGrowthTrend.length}`);
      }
    ]);
  }

  // 2. Company Admin Dashboard
  if (companyAdmin) {
    await testEndpoint('Company Admin Dashboard', '/dashboard/company-admin', companyAdmin, [
      (d) => {
        if (!Array.isArray(d.attendanceTrend)) throw new Error('attendanceTrend is not an array');
        if (!Array.isArray(d.attendanceBreakdown)) throw new Error('attendanceBreakdown is not an array');
        console.log(`   ↳ Total Employees: ${d.totalEmployees}, Present Today: ${d.presentToday}, Attendance Trend points: ${d.attendanceTrend.length}`);
      }
    ]);
  }

  // 3. HR Admin Dashboard
  if (hrAdmin || companyAdmin) {
    const userToUse = hrAdmin || companyAdmin;
    await testEndpoint('HR Admin Dashboard', '/dashboard/hr-admin', userToUse, [
      (d) => {
        if (!Array.isArray(d.attendanceTrend)) throw new Error('attendanceTrend is not an array');
        if (!Array.isArray(d.attendanceBreakdown)) throw new Error('attendanceBreakdown is not an array');
        console.log(`   ↳ Total Employees: ${d.totalEmployees}, On Leave: ${d.onLeaveToday}`);
      }
    ]);
  }

  // 4. Employee Dashboard
  if (employee || companyAdmin) {
    const userToUse = employee || companyAdmin;
    await testEndpoint('Employee Dashboard', '/dashboard/employee', userToUse, [
      (d) => {
        if (typeof d.isCheckedIn !== 'boolean') throw new Error('isCheckedIn must be boolean');
        console.log(`   ↳ Checked In: ${d.isCheckedIn}, Hours Worked: ${Math.floor(d.workMinutesToday / 60)}h`);
      }
    ]);
  }

  // 5. Payment Analytics Endpoints (Super Admin)
  if (superAdmin) {
    await testEndpoint('Payment Revenue Analytics', '/payment-analytics/revenue', superAdmin, [
      (d) => {
        if (!Array.isArray(d.monthlyTrend)) throw new Error('monthlyTrend must be an array');
        console.log(`   ↳ Total Revenue: ₹${d.totalRevenue}, Monthly Trend points: ${d.monthlyTrend.length}`);
      }
    ]);

    await testEndpoint('Payment MRR Analytics', '/payment-analytics/mrr', superAdmin, [
      (d) => {
        if (typeof d.mrr !== 'number') throw new Error('mrr must be a number');
        console.log(`   ↳ Active MRR: ₹${d.mrr}`);
      }
    ]);

    await testEndpoint('Payment ARR Analytics', '/payment-analytics/arr', superAdmin, [
      (d) => {
        if (typeof d.arr !== 'number') throw new Error('arr must be a number');
        console.log(`   ↳ Active ARR: ₹${d.arr}`);
      }
    ]);

    await testEndpoint('Payment Churn Analytics', '/payment-analytics/churn', superAdmin, [
      (d) => {
        if (!Array.isArray(d.monthlyTrend)) throw new Error('monthlyTrend must be an array');
        console.log(`   ↳ Churn Rate: ${d.churnRate}%, Monthly Trend points: ${d.monthlyTrend.length}`);
      }
    ]);

    await testEndpoint('Payment Success Rate Analytics', '/payment-analytics/success-rate', superAdmin, [
      (d) => {
        if (!Array.isArray(d.dailyTrend)) throw new Error('dailyTrend must be an array');
        console.log(`   ↳ Overall Success Rate: ${d.overallSuccessRate}%, Daily Trend points: ${d.dailyTrend.length}`);
      }
    ]);

    await testEndpoint('Payment Refund Analytics', '/payment-analytics/refunds', superAdmin, [
      (d) => {
        if (!Array.isArray(d.reasons)) throw new Error('reasons must be an array');
        console.log(`   ↳ Refund Rate: ${d.refundRate}%, Refund Count: ${d.refundCount}`);
      }
    ]);

    await testEndpoint('Payment Method Distribution', '/payment-analytics/payment-methods', superAdmin, [
      (d) => {
        if (!Array.isArray(d.methods)) throw new Error('methods must be an array');
        console.log(`   ↳ Active Payment Methods: ${d.methods.length}`);
      }
    ]);
  }

  // 6. Attendance Stats & Monthly Summary (Company Admin / HR)
  if (companyAdmin) {
    await testEndpoint('Attendance Stats Analytics', '/attendance/stats', companyAdmin, [
      (d) => {
        if (!Array.isArray(d.trend)) throw new Error('trend must be an array');
        if (!Array.isArray(d.departmentBreakdown)) throw new Error('departmentBreakdown must be an array');
        console.log(`   ↳ Present: ${d.present}, Attendance Rate: ${d.attendanceRate}%, Trend points: ${d.trend.length}`);
      }
    ]);

    await testEndpoint('Attendance Monthly Summary', '/attendance/monthly-summary', companyAdmin, [
      (d) => {
        if (typeof d.presentDays !== 'number') throw new Error('presentDays must be a number');
        console.log(`   ↳ Present Days: ${d.presentDays}, Total Working: ${d.totalWorkingDays}`);
      }
    ]);
  }

  // 7. Security Dashboard
  if (superAdmin || companyAdmin) {
    const userToUse = superAdmin || companyAdmin;
    await testEndpoint('Security Dashboard', '/security/dashboard', userToUse, [
      (d) => {
        console.log(`   ↳ Security Score: ${d.securityScore}/100, Failed Logins: ${d.failedLogins24h || 0}`);
      }
    ]);
  }

  console.log('\n====================================================');
  console.log(`🏁 TEST SUMMARY: ${results.endpointsPassed}/${results.endpointsTested} PASSED`);
  console.log('====================================================');

  await prisma.$disconnect();
  process.exit(results.endpointsPassed === results.endpointsTested ? 0 : 1);
}

runTests().catch(async (e) => {
  console.error('Fatal error running tests:', e);
  await prisma.$disconnect();
  process.exit(1);
});
