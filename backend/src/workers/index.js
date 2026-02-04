require('dotenv').config();
const syncWorker = require('./sync.worker');

console.log('🔧 Starting BullMQ workers...');
console.log('✅ Sync worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing workers...');
  await syncWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing workers...');
  await syncWorker.close();
  process.exit(0);
});
