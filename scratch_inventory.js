const fs = require('fs');
const path = require('path');

// 1. Scan app.js and routes/index.js for mounts
const appJs = fs.readFileSync(path.join(__dirname, 'backend/src/app.js'), 'utf8');
const routesIndexJs = fs.readFileSync(path.join(__dirname, 'backend/src/routes/index.js'), 'utf8');

// Find all .routes.js files in modules
const modulesDir = path.join(__dirname, 'backend/src/modules');
function getRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getRouteFiles(fullPath));
    } else if (file.endsWith('.routes.js') || file.endsWith('routes.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const routeFiles = getRouteFiles(modulesDir);

// Known prefix mapping from routes/index.js & app.js
const prefixMap = {
  'auth': '/auth',
  'companies': '/companies',
  'employees': '/employees',
  'attendance': '/attendance',
  'attendance-security': '/attendance-security',
  'biometric-cards': '/biometric-cards',
  'biometric-devices': '/biometric-devices',
  'device-punches': '/device-punches',
  'face-registration': '/face-registration',
  'finger-attendance': '/finger-attendance',
  'emergency-attendance': '/emergency-attendance',
  'advanced-security': '/advanced-security',
  'notifications': '/notifications',
  'branches': '/branches',
  'departments': '/departments',
  'designations': '/designations',
  'documents': '/documents',
  'reports': '/reports',
  'leave': '/leave',
  'payroll': '/payroll',
  'overtime': '/overtime',
  'shifts': '/shifts',
  'rosters': '/rosters',
  'holidayCalendar': '/holiday-calendar',
  'subscriptions': '/subscriptions',
  'approvals': '/approvals',
  'assets': '/assets',
  'queue-monitor': '/queue-monitor',
  'refunds': '/refunds',
  'payments': '/payments',
  'invoices': '/invoices',
  'payment-analytics': '/payment-analytics',
  'coupons': '/coupons',
  'client-portal': '/client-portal',
  'projects': '/projects',
  'tasks': '/tasks',
  'health': '/health',
  'ai': '/ai',
  'dashboard': '/dashboard',
  'settings': '/settings',
  'activity-logs': '/activity-logs',
  'audit-logs': '/audit-logs'
};

const endpoints = [];
const moduleCounts = {};

routeFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const moduleName = path.basename(path.dirname(filePath));
  const fileName = path.basename(filePath);
  
  // Find router method calls: router.get('/path', ...), router.post, router.put, router.patch, router.delete
  // Also router.route('/path').get(...).post(...)
  const regex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    let routePath = match[2];
    
    // determine prefix
    let prefix = prefixMap[moduleName] || `/${moduleName}`;
    if (fileName.includes('security')) prefix = '/advanced-security';
    if (fileName.includes('dashboard')) prefix = '/dashboard';
    
    // Normalize path
    if (!routePath.startsWith('/')) routePath = '/' + routePath;
    if (routePath === '/') routePath = '';
    
    const fullPath = `${prefix}${routePath}`;
    endpoints.push({
      module: moduleName,
      file: fileName,
      method,
      subPath: match[2],
      fullPath,
      apiPath: `/api/v1${fullPath}`
    });

    moduleCounts[moduleName] = (moduleCounts[moduleName] || 0) + 1;
  }

  // Also match router.route('/path').get(...)...
  const routeRegex = /router\.route\s*\(\s*['"`]([^'"`]+)['"`]\)\s*\.([a-z]+)/g;
  while ((match = routeRegex.exec(content)) !== null) {
    const routePath = match[1];
    const method = match[2].toUpperCase();
    if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let prefix = prefixMap[moduleName] || `/${moduleName}`;
      const fullPath = `${prefix}${routePath.startsWith('/') ? routePath : '/' + routePath}`;
      endpoints.push({
        module: moduleName,
        file: fileName,
        method,
        subPath: routePath,
        fullPath,
        apiPath: `/api/v1${fullPath}`
      });
      moduleCounts[moduleName] = (moduleCounts[moduleName] || 0) + 1;
    }
  }
});

// Also scan backend/src/routes/index.js for direct router definitions (like dashboard, health, analytics)
const indexDirectRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
let match;
while ((match = indexDirectRegex.exec(routesIndexJs)) !== null) {
  const method = match[1].toUpperCase();
  const routePath = match[2];
  let mod = 'core/platform';
  if (routePath.includes('dashboard')) mod = 'dashboard';
  else if (routePath.includes('health')) mod = 'health';
  else if (routePath.includes('super-admin')) mod = 'super-admin';
  else if (routePath.includes('company-admin')) mod = 'company-admin';
  
  endpoints.push({
    module: mod,
    file: 'routes/index.js',
    method,
    subPath: routePath,
    fullPath: routePath.startsWith('/') ? routePath : '/' + routePath,
    apiPath: `/api/v1${routePath.startsWith('/') ? routePath : '/' + routePath}`
  });
  moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
}

console.log(JSON.stringify({
  totalEndpoints: endpoints.length,
  moduleCounts,
  sample: endpoints.slice(0, 5)
}, null, 2));

// Save inventory to JSON file
fs.writeFileSync(path.join(__dirname, 'endpoint_inventory.json'), JSON.stringify(endpoints, null, 2));
