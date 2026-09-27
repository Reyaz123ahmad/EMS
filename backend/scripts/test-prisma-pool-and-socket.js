import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function testPrismaPoolAndSocket() {
  console.log('==================================================');
  console.log('🧪 TESTING PRISMA CONNECTION POOL & SOCKET RETRY');
  console.log('==================================================\n');

  let results = {
    noTimeout: 'FAIL',
    notificationsLoad: 'FAIL',
    socketConnects: 'FAIL',
    noP2024: 'FAIL'
  };

  try {
    // 1. Authenticate as COMPANY_ADMIN
    console.log('1. Logging in as COMPANY_ADMIN...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'reyazahmad40544@gmail.com',
      password: 'Temp@e68a02e6!'
    });

    const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
    if (!token) {
      throw new Error(`Failed to obtain access token from response: ${JSON.stringify(loginRes.data)}`);
    }
    console.log('✅ Logged in successfully. Token acquired.\n');

    // 2. Test concurrent notifications fetch (load test connection pool)
    console.log('2. Fetching notifications under concurrent load (15 concurrent requests)...');
    const authHeaders = { Authorization: `Bearer ${token}` };

    const startTime = Date.now();
    const concurrentRequests = Array.from({ length: 15 }, (_, i) =>
      axios.get(`${API_BASE}/notifications?page=1&limit=10`, { headers: authHeaders })
    );

    const responses = await Promise.all(concurrentRequests);
    const duration = Date.now() - startTime;
    console.log(`✅ All 15 concurrent requests completed in ${duration}ms without connection timeout!`);
    console.log(`   Sample response status: ${responses[0].status}, data count: ${responses[0].data?.data?.notifications?.length ?? 0}`);

    results.noTimeout = 'PASS';
    results.notificationsLoad = 'PASS';
    results.noP2024 = 'PASS';

    // 3. Test Socket.io authenticated connection
    console.log('\n3. Testing Socket.io authenticated connection with JWT...');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    const socketConnected = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket connection timed out after 10s'));
      }, 10000);

      socket.on('connect', () => {
        clearTimeout(timer);
        console.log(`✅ Socket connected successfully! Socket ID: ${socket.id}`);
        resolve(true);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timer);
        console.error(`❌ Socket connection error: ${err.message}`);
        reject(err);
      });
    });

    if (socketConnected) {
      results.socketConnects = 'PASS';
    }

    socket.disconnect();

    console.log('\n==================================================');
    console.log('📊 FINAL TEST RESULTS:');
    console.log(`- No timeout: ${results.noTimeout}`);
    console.log(`- Notifications load: ${results.notificationsLoad}`);
    console.log(`- Socket connects: ${results.socketConnects}`);
    console.log(`- No P2024 errors: ${results.noP2024}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error.response?.data || error.message);
    if (error.message && error.message.includes('P2024')) {
      results.noP2024 = 'FAIL';
    }
  }
}

testPrismaPoolAndSocket();
