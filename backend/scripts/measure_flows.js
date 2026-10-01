import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000/api/v1';
const SUPER_EMAIL = 'reyazahmadmath@gmail.com';
const SUPER_PASSWORD = 'Reyaz123@_Ahmad';

async function measureLogin() {
  console.log('--- MEASURING LOGIN ---');
  const start = performance.now();
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: SUPER_EMAIL,
      password: SUPER_PASSWORD
    });
    const duration = Math.round(performance.now() - start);
    console.log(`Login status: ${res.status} in ${duration}ms`);
    return { token: res.data.data.accessToken, user: res.data.data.user, duration };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    console.error(`Login failed in ${duration}ms:`, err.response?.data || err.message);
    throw err;
  }
}

async function run() {
  try {
    const { token, user, duration: loginDuration } = await measureLogin();
    console.log(`User ID: ${user.id}, Role: ${user.role}`);

    const authHeaders = {
      Authorization: `Bearer ${token}`
    };

    // Check today status
    const statusRes = await axios.get(`${BASE_URL}/attendance/today`, { headers: authHeaders });
    console.log('Current attendance today:', statusRes.data.data);

    // Measure check-in
    console.log('\n--- MEASURING CHECK-IN ---');
    const t1 = performance.now();
    try {
      const checkInRes = await axios.post(`${BASE_URL}/attendance/check-in`, {
        mode: 'card',
        cardNumber: 'CARD-12345',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      }, { headers: authHeaders });
      const d1 = Math.round(performance.now() - t1);
      console.log(`Check-in result (${d1}ms):`, checkInRes.data.message || checkInRes.data);
    } catch (err) {
      const d1 = Math.round(performance.now() - t1);
      console.log(`Check-in response (${d1}ms):`, err.response?.data?.message || err.message);
    }

    // Measure break start
    console.log('\n--- MEASURING BREAK START ---');
    const t2 = performance.now();
    try {
      const breakStartRes = await axios.post(`${BASE_URL}/attendance/break-start`, {
        mode: 'card',
        cardNumber: 'CARD-12345',
        breakType: 'SHORT',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      }, { headers: authHeaders });
      const d2 = Math.round(performance.now() - t2);
      console.log(`Break-start result (${d2}ms):`, breakStartRes.data.message || breakStartRes.data);
    } catch (err) {
      const d2 = Math.round(performance.now() - t2);
      console.log(`Break-start response (${d2}ms):`, err.response?.data?.message || err.message);
    }

    // Measure break end
    console.log('\n--- MEASURING BREAK END ---');
    const t3 = performance.now();
    try {
      const breakEndRes = await axios.post(`${BASE_URL}/attendance/break-end`, {
        mode: 'card',
        cardNumber: 'CARD-12345',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      }, { headers: authHeaders });
      const d3 = Math.round(performance.now() - t3);
      console.log(`Break-end result (${d3}ms):`, breakEndRes.data.message || breakEndRes.data);
    } catch (err) {
      const d3 = Math.round(performance.now() - t3);
      console.log(`Break-end response (${d3}ms):`, err.response?.data?.message || err.message);
    }

    // Measure check-out
    console.log('\n--- MEASURING CHECK-OUT ---');
    const t4 = performance.now();
    try {
      const checkOutRes = await axios.post(`${BASE_URL}/attendance/check-out`, {
        mode: 'card',
        cardNumber: 'CARD-12345',
        location: { lat: 28.6139, lng: 77.2090, accuracy: 10 }
      }, { headers: authHeaders });
      const d4 = Math.round(performance.now() - t4);
      console.log(`Check-out result (${d4}ms):`, checkOutRes.data.message || checkOutRes.data);
    } catch (err) {
      const d4 = Math.round(performance.now() - t4);
      console.log(`Check-out response (${d4}ms):`, err.response?.data?.message || err.message);
    }

  } catch (err) {
    console.error('Test run failed:', err);
  }
}

run();
