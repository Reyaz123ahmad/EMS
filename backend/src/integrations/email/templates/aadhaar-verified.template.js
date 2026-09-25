export const aadhaarVerifiedTemplate = ({ employeeName, employeeCode, maskedAadhaar, transactionId, verifiedAt }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: #ecfdf5; color: #10b981; font-size: 24px; font-weight: bold; margin-bottom: 10px;">✓</div>
        <h2 style="color: #065f46; margin: 0;">Aadhaar Verification Completed</h2>
        <p style="color: #64748b; font-size: 14px;">Enterprise Management System (EMS)</p>
      </div>
      <div style="background-color: #f0fdf4; padding: 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
          Aadhaar authentication via UIDAI OTP has succeeded for <strong>${employeeName}</strong> (${employeeCode || 'N/A'}).
          The document has been verified and registered.
        </p>
      </div>
      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Masked Aadhaar:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${maskedAadhaar}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">UIDAI Transaction ID:</td>
          <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Verified Timestamp:</td>
          <td style="padding: 8px 0; color: #0f172a;">${verifiedAt ? new Date(verifiedAt).toLocaleString() : new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        Automated notification sent by EMS Document Management System.
      </p>
    </div>
  `;
};

export default aadhaarVerifiedTemplate;
