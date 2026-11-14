// ==============================================================================
// LOCAL ORCHESTRATOR FOR VIVA & QUICK DEMO
// Spawns all 5 microservices concurrently without needing Docker installed!
// ==============================================================================

const { spawn } = require('child_process');
const path = require('path');

const services = [
  { name: 'Catalog-Service', dir: 'catalog-service', port: 3001, color: '\x1b[36m' }, // Cyan
  { name: 'Order-Service  ', dir: 'order-service', port: 3002, color: '\x1b[33m' }, // Yellow
  { name: 'Rating-Service ', dir: 'rating-service', port: 3003, color: '\x1b[35m' }, // Magenta
  { name: 'Notif-Service  ', dir: 'notification-service', port: 3004, color: '\x1b[32m' }, // Green
  { name: 'API-Gateway    ', dir: 'api-gateway', port: 3000, color: '\x1b[34m' }  // Blue
];

const RESET = '\x1b[0m';

console.log('=================================================================');
console.log('  🎂 CAKE DELIGHT - CLOUD NATIVE MICROSERVICES RUNNER');
console.log('=================================================================\n');

services.forEach(svc => {
  const child = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, svc.dir),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, PORT: svc.port }
  });

  child.stdout.on('data', data => {
    process.stdout.write(`${svc.color}[${svc.name}]${RESET} ${data}`);
  });

  child.stderr.on('data', data => {
    process.stderr.write(`${svc.color}[${svc.name} ERR]${RESET} ${data}`);
  });

  child.on('close', code => {
    console.log(`${svc.color}[${svc.name}]${RESET} stopped with exit code ${code}`);
  });
});

setTimeout(() => {
  console.log('\n-----------------------------------------------------------------');
  console.log('  🚀 All microservices are online!');
  console.log('  👉 Open Web Application:  http://localhost:3000');
  console.log('  👉 Catalog Health API:    http://localhost:3001/health');
  console.log('  👉 Order Health API:      http://localhost:3002/health');
  console.log('  👉 Rating Health API:     http://localhost:3003/health');
  console.log('  👉 Notif Health API:      http://localhost:3004/health');
  console.log('-----------------------------------------------------------------\n');
}, 1500);
