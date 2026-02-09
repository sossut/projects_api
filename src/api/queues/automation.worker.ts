import { Worker } from 'bullmq';
import { automationQueue } from './automation.queue';
import { processProjectSearch } from './processors/projectSearch.processor';
import { processCompanyExtract } from './processors/companyExtract.processor';
import {
  processProjectEnrichment,
  processBatchEnrichment
} from './processors/enrichment.processor';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

const scheduleProjectSearch = async () => {
  const cronEnv = process.env.PROJECT_SEARCH_CRON;
  const cron =
    cronEnv !== undefined
      ? cronEnv.trim()
      : process.env.NODE_ENV === 'development'
        ? '*/5 * * * *'
        : undefined;

  if (!cron || cron.toLowerCase() === 'off') {
    return;
  }

  const location = process.env.PROJECT_SEARCH_LOCATION || 'Hanoi';
  const buildingType =
    process.env.PROJECT_SEARCH_BUILDING_TYPE || 'residential';

  const existing = await automationQueue.getRepeatableJobs();
  const toRemove = existing.filter((job) => job.name === 'project-search');
  for (const job of toRemove) {
    await automationQueue.removeRepeatableByKey(job.key);
  }

  await automationQueue.add(
    'project-search',
    { location, buildingType },
    {
      repeat: { pattern: cron },
      jobId: `project-search:${location}:${buildingType}`
    }
  );

  console.log(
    `Scheduled project-search for ${location} (${buildingType}) on cron ${cron}`
  );
};

// Worker for automation queue
export const automationWorker = new Worker(
  'automation',
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'project-search':
        return processProjectSearch(job);

      case 'company-extract':
        return processCompanyExtract(job);

      case 'enrich-project':
        return processProjectEnrichment(job);

      case 'enrich-batch':
        return processBatchEnrichment(job);

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 2, // Process max 2 jobs at once
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000 // per minute (rate limiting for API calls)
    }
  }
);

automationWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

automationWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
scheduleProjectSearch().catch((err) => {
  console.error('Failed to schedule project-search job:', err);
});
console.log('Automation worker starting');
console.log('Automation worker started');
