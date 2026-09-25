export function paymentRetryTemplate({ companyName, attemptNumber, nextAttemptDate }) {
  return {
    subject: `[EMS] Payment Retry Attempt #${attemptNumber || 1}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #d97706;">Automatic Payment Retry Scheduled</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Following the previous charge failure, our automated dunning system will re-attempt payment on <strong>${nextAttemptDate || 'tomorrow'}</strong>.</p>
        <p>Please ensure sufficient funds or active billing permissions on your card.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default paymentRetryTemplate;
