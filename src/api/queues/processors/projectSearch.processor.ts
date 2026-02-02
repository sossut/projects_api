import { Job } from 'bullmq';
import { discoverProjects } from '../../services/automation.service';

// BullMQ processor for project search jobs
export const processProjectSearch = async (job: Job) => {
  const { query } = job.data;

  console.log(`Processing project search: ${query}`);

  // Update progress
  await job.updateProgress(10);

  try {
    // Run the discovery process
    const results = await discoverProjects(query);

    await job.updateProgress(100);

    return {
      success: true,
      query,
      ...results
    };
  } catch (error) {
    console.error('Project search failed:', error);
    throw error;
  }
};
