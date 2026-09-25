export function trialEndedTemplate({ companyName }) {
  return {
    subject: `[EMS] Your 14-Day Free Trial Has Concluded`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #475569;">Trial Period Ended</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your 14-day free trial has expired. Select a plan to convert your trial and unlock complete enterprise features.</p>
        <a href="https://app.ems-cloud.internal/subscription/plans" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Upgrade Now</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default trialEndedTemplate;
