/* eslint-disable @typescript-eslint/indent */
import { Worker } from 'bullmq';
import { automationQueue } from './automation.queue';
import { processProjectSearch } from './processors/projectSearch.processor';
import { processCompanyExtract } from './processors/companyExtract.processor';
// import {
//   processProjectEnrichment,
//   processBatchEnrichment,
//   processFirstPassProjectEnrichment
// } from './processors/enrichment.processor';
import { getAutomatedMetroAreas } from '../models/metroAreaModel';
import { getProjectsForBatchEnrichment } from '../models/projectModel';
import { processProjectEnrichment } from './processors/enrichment.processor';
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
        ? '0 0 1 */2 *' // Every 2 months at 1:00 AM in development
        : undefined;
  console.log('PROJECT_SEARCH_CRON:', process.env.PROJECT_SEARCH_CRON);
  if (!cron || cron.toLowerCase() === 'off') {
    console.log('off');
    return;
  }

  const metroAreas = await getAutomatedMetroAreas();
  if (!metroAreas.length) {
    console.warn(
      'No metro areas found for automation. Please add entries to the metro_areas table with automate = true.'
    );
    return;
  }
  const batchEnrichmentProjects = await getProjectsForBatchEnrichment(
    metroAreas.map((m) => m.id as number)
  );

  const buildingTypes = ['A', 'B', 'C', 'D'];

  for (const metroArea of metroAreas) {
    for (const buildingType of buildingTypes) {
      const existing = await automationQueue.getJobSchedulers();
      const toRemove = existing.filter((job) => job.name === 'project-search');
      for (const job of toRemove) {
        await automationQueue.removeJobScheduler(job.key);
      }
      await automationQueue.add(
        'project-search',
        { location: metroArea.name, buildingType },
        {
          repeat: { pattern: cron },
          jobId: `project-search:${metroArea.name}:${buildingType}`
        }
      );
      console.log(
        `Scheduled project-search for ${metroArea.name} (${buildingType}) on cron ${cron}`
      );
    }
  }

  for (const project of batchEnrichmentProjects) {
    await automationQueue.add(
      'enrich-project',
      { projectId: project.id },
      {
        jobId: `enrich-project:${project.id}`
      }
    );
  }
};
// const location = process.env.PROJECT_SEARCH_LOCATION || 'Hanoi';
// const buildingType = process.env.PROJECT_SEARCH_BUILDING_TYPE || 'A';

// const existing = await automationQueue.getJobSchedulers();
// const toRemove = existing.filter((job) => job.name === 'project-search');
// for (const job of toRemove) {
//   await automationQueue.removeJobScheduler(job.key);
// }

// await automationQueue.add(
//   'project-search',
//   { location, buildingType },
//   {
//     repeat: { pattern: cron },
//     jobId: `project-search:${location}:${buildingType}`
//   }
// );

// console.log(
//   `Scheduled project-search for ${location} (${buildingType}) on cron ${cron}`
// );

// Worker for automation queue
export const automationWorker = new Worker(
  'automation',
  async (job) => {
    console.log(job);
    console.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'project-search':
        return processProjectSearch(job);

      case 'company-extract':
        return processCompanyExtract(job);

      case 'enrich-project':
        return processProjectEnrichment(job);

      // case 'enrich-batch':
      //   return processBatchEnrichment(job);

      // case 'enrich-after-first-pass-gpt5':
      //   return processFirstPassProjectEnrichment(job);

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

console.log('Automation worker started');
