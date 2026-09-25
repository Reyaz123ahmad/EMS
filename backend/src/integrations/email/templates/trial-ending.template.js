export function trialEndingTemplate({ companyName, daysRemaining }) {
  return {
    subject: `[EMS] Your 14-Day Free Trial Ends in ${daysRemaining} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Your Trial is Ending Soon</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>You have <strong>${daysRemaining} days left</strong> in your free trial of the EMS Enterprise platform.</p>
        <p>Upgrade to a paid plan today to ensure no disruption to employee attendance records and automated HR pipelines.</p>
        <a href="https://app.ems-cloud.internal/subscription/plans" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Choose a Plan</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default trialEndingTemplate;
