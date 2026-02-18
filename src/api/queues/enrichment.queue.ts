import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

export const enrichmentQueue = new Queue('enrichment', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 100 // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 10 // Keep last 10 failed jobs
    }
  }
});

console.log('Enrichment queue initialized');
