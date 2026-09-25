export function mockRazorpayResponse() {
  return {
    id: `pay_mock_${Date.now()}`,
    amount: 50000,
    currency: 'INR',
    status: 'captured',
    method: 'card',
  };
}

export function mockCloudinaryUpload() {
  return {
    public_id: `photo_mock_${Date.now()}`,
    secure_url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
    format: 'jpg',
    bytes: 102400,
  };
}

export default {
  mockRazorpayResponse,
  mockCloudinaryUpload,
};
