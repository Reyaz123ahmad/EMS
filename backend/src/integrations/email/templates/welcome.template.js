/**
 * Generate Welcome Email HTML Template
 * @param {Object} options
 * @param {string} options.name
 * @param {string} [options.companyName]
 * @param {string} [options.role]
 * @param {string} [options.loginUrl]
 * @returns {string} HTML string
 */
export function getWelcomeEmailTemplate({
  name = 'Team Member',
  companyName = 'Mindstocs EMS',
  role = 'Employee',
  loginUrl = 'http://localhost:3000/login'
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
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
      background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
      padding: 36px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 15px;
      opacity: 0.95;
    }
    .body-content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #0f172a;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 20px;
    }
    .features-list {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .features-list h3 {
      margin: 0 0 12px;
      font-size: 15px;
      color: #0369a1;
    }
    .features-list ul {
      margin: 0;
      padding-left: 20px;
      color: #0c4a6e;
      font-size: 13px;
      line-height: 1.8;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 24px;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
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
      <h1>Welcome to ${companyName}!</h1>
      <p>Your workspace is ready</p>
    </div>
    <div class="body-content">
      <div class="greeting">Hello ${name},</div>
      <div class="text">
        Welcome aboard! We are thrilled to have you join our team. Your role has been configured as <strong>${role}</strong>.
      </div>
      
      <div class="features-list">
        <h3>What you can do in your portal:</h3>
        <ul>
          <li>Mark attendance with GPS Geo-Fencing & Face Biometrics</li>
          <li>Apply for leaves and track balance in real-time</li>
          <li>Access monthly payslips and tax documents</li>
          <li>View company announcements and team directory</li>
        </ul>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Go to My Dashboard</a>
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

export default getWelcomeEmailTemplate;
