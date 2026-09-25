export const aadhaarOtpSentTemplate = ({ employeeName, transactionId, expiresInMinutes = 10 }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin: 0;">Aadhaar Verification In Progress</h2>
        <p style="color: #64748b; font-size: 14px;">Enterprise Management System (EMS)</p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;">Hello <strong>${employeeName || 'Employee'}</strong>,</p>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
          An Aadhaar OTP verification request has been initiated for your document verification.
          UIDAI has dispatched a one-time password (OTP) to your Aadhaar-registered mobile number.
        </p>
      </div>
      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Transaction ID:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-family: monospace;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Validity:</td>
          <td style="padding: 8px 0; color: #0f172a;">${expiresInMinutes} minutes</td>
        </tr>
      </table>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        If you did not request this verification, please report it immediately to your HR administrator.
      </p>
    </div>
  `;
};

export default aadhaarOtpSentTemplate;
