export function refundRejectedTemplate({ companyName, amount, rejectionReason }) {
  return {
    subject: `[EMS] Update on Your Refund Request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #dc2626;">Refund Request Declined</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your refund request for amount <strong>₹${amount}</strong> was reviewed and could not be approved at this time.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${rejectionReason || 'Policy terms not met'}</p>
        </div>
        <p>If you believe this was in error, please contact your EMS dedicated account manager.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default refundRejectedTemplate;
