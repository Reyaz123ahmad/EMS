export function subscriptionExpiringTemplate({ companyName, planName, daysRemaining }) {
  return {
    subject: `[EMS] Action Required: Your ${planName || ''} Subscription Expires in ${daysRemaining} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Subscription Renewal Reminder</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your subscription for plan <strong>${planName || 'Enterprise'}</strong> is due to expire in <strong>${daysRemaining} days</strong>.</p>
        <p>Renew today to ensure seamless continuous access to employee face registration, clock-ins, and payroll automation.</p>
        <a href="https://app.ems-cloud.internal/subscription/renew" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Renew Subscription</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default subscriptionExpiringTemplate;
