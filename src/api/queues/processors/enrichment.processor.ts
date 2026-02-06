import { Job } from 'bullmq';
import {
  enrichProject,
  enrichProjectsBatch
} from '../../services/automation.service';

// Process single project enrichment
export const processProjectEnrichment = async (job: Job) => {
  const { projectId } = job.data;

  console.log(`Processing enrichment for project ID: ${projectId}`);

  await job.updateProgress(10);

  try {
    const result = await enrichProject(projectId);

    await job.updateProgress(100);

    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error(`Enrichment failed for project ${projectId}:`, error);
    throw error;
  }
};

// Process batch enrichment
export const processBatchEnrichment = async (job: Job) => {
  const { projectIds } = job.data;

  console.log(`Processing batch enrichment for ${projectIds.length} projects`);

  // const totalProjects = projectIds.length;
  await job.updateProgress(5);

  try {
    const results = await enrichProjectsBatch(projectIds);

    await job.updateProgress(100);

    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('Batch enrichment failed:', error);
    throw error;
  }
};
