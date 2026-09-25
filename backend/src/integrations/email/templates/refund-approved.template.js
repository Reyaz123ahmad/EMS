export function refundApprovedTemplate({ companyName, amount, adminNotes }) {
  return {
    subject: `[EMS] Refund Request Approved - ₹${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #16a34a;">Refund Request Approved</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>Your refund request for <strong>₹${amount}</strong> has been approved by our finance administration team.</p>
        ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
        <p>The payout is being queued to your original payment gateway account via Razorpay.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default refundApprovedTemplate;
