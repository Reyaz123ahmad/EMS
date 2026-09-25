/**
 * Generate Credentials Email HTML Template
 * @param {Object} options
 * @param {string} options.name
 * @param {string} options.email
 * @param {string} options.password
 * @param {string} options.role
 * @param {string} [options.companyName]
 * @param {string} [options.employeeCode]
 * @param {string} [options.department]
 * @param {string} [options.loginUrl]
 * @returns {string} HTML string
 */
export function getCredentialsEmailTemplate({
  name = 'User',
  email,
  password,
  role = 'EMPLOYEE',
  companyName = 'Mindstocs EMS',
  employeeCode,
  department,
  loginUrl = 'http://localhost:3000/login'
}) {
  const isAdmin = role === 'SUPER_ADMIN' || role === 'COMPANY_ADMIN' || role === 'HR_ADMIN';
  const headerGradient = isAdmin
    ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)';
  const buttonColor = isAdmin ? '#10b981' : '#8b5cf6';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Credentials - ${companyName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .email-container {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: ${headerGradient};
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
      opacity: 0.9;
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
    .cred-table {
      width: 100%;
      border-collapse: collapse;
      background: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }
    .cred-table td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #edf2f7;
    }
    .cred-table tr:last-child td {
      border-bottom: none;
    }
    .cred-label {
      color: #64748b;
      font-weight: 500;
      width: 35%;
    }
    .cred-value {
      color: #0f172a;
      font-weight: 600;
      font-family: monospace;
      font-size: 14px;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px;
    }
    .btn {
      display: inline-block;
      background-color: ${buttonColor};
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 24px;
    }
    .warning-box p {
      margin: 0;
      font-size: 12px;
      color: #991b1b;
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
      <p>Welcome to Employee Management System</p>
    </div>
    <div class="body-content">
      <div class="greeting">Hello ${name},</div>
      <div class="text">
        Your account on <strong>${companyName}</strong> has been created. Below are your initial login credentials to access the portal:
      </div>
      
      <table class="cred-table">
        <tr>
          <td class="cred-label">Login Email:</td>
          <td class="cred-value">${email}</td>
        </tr>
        <tr>
          <td class="cred-label">Temporary Password:</td>
          <td class="cred-value">${password}</td>
        </tr>
        <tr>
          <td class="cred-label">Role:</td>
          <td class="cred-value">${role}</td>
        </tr>
        ${employeeCode ? `
        <tr>
          <td class="cred-label">Employee Code:</td>
          <td class="cred-value">${employeeCode}</td>
        </tr>` : ''}
        ${department ? `
        <tr>
          <td class="cred-label">Department:</td>
          <td class="cred-value">${department}</td>
        </tr>` : ''}
      </table>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Login to Your Portal</a>
      </div>

      <div class="warning-box">
        <p><strong>Important Security Notice:</strong> Please change your temporary password upon your first login to secure your account.</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${companyName}. Powered by Mindstocs EMS.
    </div>
  </div>
</body>
</html>
  `.trim();
}
