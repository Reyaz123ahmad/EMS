export const aadhaarDemoUploadTemplate = ({ employeeName, employeeCode, maskedAadhaar, uploadedAt }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #d97706; margin: 0;">Aadhaar Document Upload (Demo Mode)</h2>
        <p style="color: #64748b; font-size: 14px;">Enterprise Management System (EMS)</p>
      </div>
      <div style="background-color: #fffbeb; padding: 16px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
          An Aadhaar document was uploaded in <strong>DEMO MODE</strong> for <strong>${employeeName}</strong> (${employeeCode || 'N/A'}).
          OTP verification was bypassed as demo mode is active. Document status is set to <strong>PENDING</strong> manual review.
        </p>
      </div>
      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Masked Aadhaar:</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${maskedAadhaar}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Verification Method:</td>
          <td style="padding: 8px 0; color: #0f172a;">DEMO (Manual verification required)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Uploaded At:</td>
          <td style="padding: 8px 0; color: #0f172a;">${uploadedAt ? new Date(uploadedAt).toLocaleString() : new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        Please review and verify the document in the EMS Document Management portal.
      </p>
    </div>
  `;
};

export default aadhaarDemoUploadTemplate;
