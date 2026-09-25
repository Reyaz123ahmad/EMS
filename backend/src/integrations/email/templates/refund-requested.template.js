export function refundRequestedTemplate({ companyName, amount, reason, requestId }) {
  return {
    subject: `[EMS] Refund Request Received - ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">Refund Request Under Review</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>We have received your refund request for payment transaction <strong>#${requestId || ''}</strong>.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 4px 0;"><strong>Requested Amount:</strong> ₹${amount}</p>
          <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> PENDING APPROVAL</p>
        </div>
        <p>Our platform operations team is reviewing your claim and will update you within 1-2 business days.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default refundRequestedTemplate;
