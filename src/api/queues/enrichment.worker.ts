import { Worker } from 'bullmq';
// import { enrichmentQueue } from './enrichment.queue';
import {
  processProjectEnrichment,
  processBatchEnrichment,
  processFirstPassProjectEnrichment
} from './processors/enrichment.processor';
import { processCompanyExtract } from './processors/companyExtract.processor';
import { processProjectSearch } from './processors/projectSearch.processor';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

// Worker for single project enrichment

export const enrichmentWorker = new Worker(
  'enrichment',
  async (job) => {
    console.log(job);
    console.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'enrich-project':
        return processProjectEnrichment(job);

      case 'enrich-batch':
        return processBatchEnrichment(job);

      case 'enrich-after-first-pass-gpt5':
        return processFirstPassProjectEnrichment(job);

      case 'project-search':
        return processProjectSearch(job);

      case 'company-extract':
        return processCompanyExtract(job);

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection,
    concurrency: 5, // Process max 5 jobs at once
    limiter: {
      max: 15, // Max 15 jobs
      duration: 60000 // per minute (rate limiting for API calls)
    }
  }
);

enrichmentWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

enrichmentWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Enrichment worker started');
