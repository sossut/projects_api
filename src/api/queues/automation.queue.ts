import { Queue } from 'bullmq';
import dotenv from 'dotenv';
dotenv.config();
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

export const automationQueue = new Queue('automation', {
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
      count: 500 // Keep last 500 failed jobs
    }
  }
});

console.log('Automation queue initialized');
