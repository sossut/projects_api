import { Job } from 'bullmq';
import { discoverCompanyProjects } from '../../services/automation.service';

// BullMQ processor for company extraction jobs
export const processCompanyExtract = async (job: Job) => {
  const { query } = job.data;

  console.log(`Processing company extraction: ${query}`);

  await job.updateProgress(10);

  try {
    const results = await discoverCompanyProjects(query);

    await job.updateProgress(100);

    return {
      success: true,
      query,
      ...results
    };
  } catch (error) {
    console.error('Company extraction failed:', error);
    throw error;
  }
};
