export function invoiceGeneratedTemplate({ companyName, invoiceNumber, amount, pdfUrl }) {
  return {
    subject: `[EMS] Tax Invoice #${invoiceNumber || ''} Generated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5;">New Invoice Available</h2>
        <p>Hello <strong>${companyName || 'Valued Customer'}</strong>,</p>
        <p>A new tax invoice <strong>#${invoiceNumber || ''}</strong> for <strong>₹${amount || ''}</strong> has been generated for your recent subscription billing.</p>
        <div style="margin: 20px 0;">
          <a href="${pdfUrl || '#'}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Download Invoice PDF</a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">EMS Enterprise SaaS Cloud Platform</p>
      </div>
    `,
  };
}

export default invoiceGeneratedTemplate;
