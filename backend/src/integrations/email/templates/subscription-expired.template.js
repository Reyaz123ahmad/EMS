export function subscriptionExpiredTemplate({ companyName }) {
  return {
    subject: `[EMS] Your Subscription Has Expired`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dc2626;">Subscription Expired</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your EMS subscription has expired. Biometric punches, automated attendance, and payroll exports are currently paused.</p>
        <p>Your company records and facial embeddings are safely preserved. Renew anytime to instantly restore full access.</p>
        <a href="https://app.ems-cloud.internal/subscription/renew" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Restore Account Access</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default subscriptionExpiredTemplate;
