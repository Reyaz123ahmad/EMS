export function paymentFailedTemplate({ companyName, amount, reason }) {
  return {
    subject: `[Urgent] EMS Subscription Payment Failed`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dc2626;">Payment Failed Notice</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>We were unable to process your recurring subscription payment of <strong>₹${amount || ''}</strong>.</p>
        <p><strong>Failure Reason:</strong> ${reason || 'Card declined or insufficient balance'}</p>
        <p>Please update your billing payment method within 7 days to avoid disruption to attendance and biometric sync.</p>
        <a href="https://app.ems-cloud.internal/subscription/current" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Update Payment Method</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default paymentFailedTemplate;
