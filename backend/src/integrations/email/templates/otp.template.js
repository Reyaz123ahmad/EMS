/**
 * Generate OTP Email HTML Template
 * @param {Object} options
 * @param {string} options.name
 * @param {string} options.otp
 * @param {string} [options.purpose]
 * @param {number} [options.expiryMinutes]
 * @param {string} [options.companyName]
 * @returns {string} HTML string
 */
export function getOTPEmailTemplate({
  name = 'User',
  otp,
  purpose = 'Account Verification',
  expiryMinutes = 10,
  companyName = 'Mindstocs EMS'
}) {
  let displayPurpose = purpose;
  if (purpose === 'COMPANY_ADMIN_CREATE') {
    displayPurpose = 'Company Admin Account Creation';
  } else if (purpose === 'EMPLOYEE_CREATE') {
    displayPurpose = 'Employee Account Creation';
  } else if (purpose === 'PASSWORD_RESET') {
    displayPurpose = 'Password Reset';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification OTP - ${companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 6px 0 0;
      font-size: 14px;
      color: #bfdbfe;
    }
    .body-content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #0f172a;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #f8fafc;
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #1d4ed8;
      margin: 0;
    }
    .otp-meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }
    .warning-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 24px;
    }
    .warning-box p {
      margin: 0;
      font-size: 12px;
      color: #92400e;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${companyName}</h1>
      <p>Security & Verification Center</p>
    </div>
    <div class="body-content">
      <div class="greeting">Hello ${name},</div>
      <div class="text">
        We received a request for <strong>${displayPurpose}</strong>. Use the one-time passcode (OTP) below to complete your verification:
      </div>
      
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-meta">Valid for ${expiryMinutes} minutes</div>
      </div>

      <div class="warning-box">
        <p><strong>Security Notice:</strong> Never share this code with anyone, including support staff. If you did not initiate this request, please ignore this email or contact support.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export default getOTPEmailTemplate;
