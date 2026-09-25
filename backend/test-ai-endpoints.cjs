const axios = require('axios');

async function testAI() {
  try {
    console.log('1. Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'admin@mindstocs.com',
      password: 'Test@123456'
    });

    const token = loginRes.data.data.accessToken;
    const user = loginRes.data.data.user;
    console.log(`Login successful for ${user.email} (${user.role})!`);

    const client = axios.create({
      baseURL: 'http://localhost:5000/api/v1/ai',
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n2. Testing AI Usage Stats endpoint [GET /usage-stats]...');
    const statsRes = await client.get('/usage-stats');
    console.log('✓ Usage Stats status:', statsRes.status, JSON.stringify(statsRes.data.data.rateLimiting));

    console.log('\n3. Testing Recommendations endpoint [GET /recommendations]...');
    const recsRes = await client.get('/recommendations');
    console.log('✓ Recommendations status:', recsRes.status, 'Source:', recsRes.data.data.source);

    console.log('\n4. Testing Anomalies endpoint [GET /anomalies?dataType=attendance]...');
    const anomRes = await client.get('/anomalies?dataType=attendance');
    console.log('✓ Anomalies status:', anomRes.status, 'Source:', anomRes.data.data.source);

    console.log('\n5. Testing Chat endpoint [POST /chat]...');
    const chatRes = await client.post('/chat', { message: 'How is our attendance trend this week?' });
    console.log('✓ Chat status:', chatRes.status, 'Reply:', chatRes.data.data.message.substring(0, 70) + '...');

    console.log('\n6. Testing Company Analytics endpoint [GET /analytics/company]...');
    const compRes = await client.get('/analytics/company');
    console.log('✓ Company Analytics status:', compRes.status, 'Source:', compRes.data.data.source);

    console.log('\n7. Testing Attendance Prediction endpoint [GET /attendance/prediction]...');
    const attRes = await client.get('/attendance/prediction');
    console.log('✓ Attendance Prediction status:', attRes.status, 'Source:', attRes.data.data.source);

    console.log('\n8. Testing Cached Insight retrieval [GET /recommendations again to test 24h cache]...');
    const recsCachedRes = await client.get('/recommendations');
    console.log('✓ Cached Recommendations status:', recsCachedRes.status, 'Source:', recsCachedRes.data.data.source);

    console.log('\n======================================================');
    console.log('🎉 ALL AI ENDPOINTS VERIFIED & WORKING PERFECTLY [200 OK] 🎉');
    console.log('======================================================');
  } catch (err) {
    console.error('Error during AI endpoint testing:', err.response?.data || err.message);
    process.exit(1);
  }
}

testAI();
