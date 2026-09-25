export function refundProcessedTemplate({ companyName, amount, razorpayRefundId }) {
  return {
    subject: `[EMS] Refund Processed - ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Refund Completed</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your refund of <strong>₹${amount}</strong> has been successfully processed through Razorpay.</p>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Gateway Reference ID:</strong> ${razorpayRefundId || 'N/A'}</p>
        </div>
        <p>Funds usually reflect in your bank account / source payment mode within 5-7 business days.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default refundProcessedTemplate;
