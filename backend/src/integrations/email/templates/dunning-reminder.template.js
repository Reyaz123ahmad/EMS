export function dunningReminderTemplate({ companyName, daysOverdue, amount }) {
  return {
    subject: `[Final Notice] EMS Account Suspension Warning - Payment Past Due`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dc2626;">Account Suspension Warning</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your subscription is currently <strong>${daysOverdue || 5} days past due</strong> for outstanding balance <strong>₹${amount || ''}</strong>.</p>
        <p>Failure to complete payment within 48 hours will result in automatic lockout and suspension of biometric attendance nodes.</p>
        <a href="https://app.ems-cloud.internal/subscription/renew" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Resolve Outstanding Balance</a>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default dunningReminderTemplate;
