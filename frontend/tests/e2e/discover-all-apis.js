import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicesDir = path.resolve(__dirname, '../../src/services');
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js') && f !== 'api.js' && f !== 'socket.service.js');

console.log(`Discovered ${serviceFiles.length} service files in frontend/src/services/:\n`);

const allEndpoints = [];

for (const file of serviceFiles) {
  const filePath = path.join(servicesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match api.<method>('endpoint' or `endpoint`)
  const regex = /api\.(get|post|put|delete|patch)\(\s*[`'"]([^`'"]+)[`'"]/g;
  let match;
  const serviceEndpoints = [];
  while ((match = regex.exec(content)) !== null) {
    serviceEndpoints.push({
      method: match[1].toUpperCase(),
      endpoint: match[2],
      file
    });
  }

  // Also match template strings with ${id} or similar
  const templateRegex = /api\.(get|post|put|delete|patch)\(\s*`([^`]+)`/g;
  while ((match = templateRegex.exec(content)) !== null) {
    if (!serviceEndpoints.some(e => e.endpoint === match[2])) {
      serviceEndpoints.push({
        method: match[1].toUpperCase(),
        endpoint: match[2],
        file
      });
    }
  }

  console.log(`- ${file}: ${serviceEndpoints.length} endpoints`);
  allEndpoints.push(...serviceEndpoints);
}

console.log(`\nTotal endpoints extracted from frontend services: ${allEndpoints.length}`);
