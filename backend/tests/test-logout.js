import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

async function testLogoutFlow() {
  console.log('--- Testing Auth and Logout Flow ---');

  try {
    // 1. Login with super admin credentials
    console.log('1. Attempting login...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'reyazahmadmath@gmail.com',
      password: 'Reyaz123@_Ahmad'
    });

    console.log('Login Response Status:', loginRes.status);
    const { accessToken, refreshToken, user } = loginRes.data.data;
    console.log('User Role:', user.role);
    console.log('Access token acquired:', !!accessToken);
    console.log('Refresh token acquired:', !!refreshToken);

    if (!refreshToken) {
      throw new Error('Refresh token missing in login response');
    }

    // 2. Test Logout with refreshToken
    console.log('2. Attempting logout with refreshToken...');
    const logoutRes = await axios.post(`${BASE_URL}/auth/logout`, { refreshToken }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('Logout Response Status:', logoutRes.status);
    console.log('Logout Response Data:', logoutRes.data);

    if (logoutRes.data.status !== 'ok') {
      throw new Error('Logout response status is not ok');
    }

    // 3. Test Refresh Token after logout (should fail because session is revoked)
    console.log('3. Verifying refresh token is invalidated after logout...');
    try {
      await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
      console.error('FAIL: Refresh token was not invalidated!');
      process.exit(1);
    } catch (err) {
      console.log('PASS: Refresh token is correctly rejected after logout:', err.response?.data?.message || err.message);
    }

    // 4. Test Logout without any token (idempotent safe logout)
    console.log('4. Testing logout endpoint resilience without token or expired token...');
    const safeLogoutRes = await axios.post(`${BASE_URL}/auth/logout`, {});
    console.log('Safe Logout Response Status:', safeLogoutRes.status);
    console.log('Safe Logout Response Data:', safeLogoutRes.data);

    console.log('\n--- ALL LOGOUT TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('Test Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testLogoutFlow();
