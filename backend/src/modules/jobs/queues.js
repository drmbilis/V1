const { Queue } = require('bullmq');
const redisConnection = require('../config/redis');

// Define queues
const syncQueue = new Queue('sync', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

const recommendationQueue = new Queue('recommendation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000
    },
    removeOnComplete: 50,
    removeOnFail: 100
  }
});

const applyQueue = new Queue('apply', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // No retry for apply operations (use idempotency instead)
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

module.exports = {
  syncQueue,
  recommendationQueue,
  applyQueue
};
