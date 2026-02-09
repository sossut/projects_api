import { Job } from 'bullmq';
import {
  discoverProjects,
  findProjectsWithGPT5
} from '../../services/automation.service';

// BullMQ processor for project search jobs
export const processProjectSearch = async (job: Job) => {
  const { query, location, buildingType } = job.data;

  if (location || buildingType) {
    console.log(
      `Processing GPT-5 project search: ${location || ''} ${buildingType || ''}`.trim()
    );
  } else {
    console.log(`Processing project search: ${query}`);
  }

  // Update progress
  await job.updateProgress(10);

  try {
    // Run GPT-5 first-pass search when location/buildingType is provided
    const results =
      location || buildingType
        ? await findProjectsWithGPT5(location || '', buildingType || '')
        : await discoverProjects(query);

    await job.updateProgress(100);

    return {
      success: true,
      query,
      location,
      buildingType,
      ...results
    };
  } catch (error) {
    console.error('Project search failed:', error);
    throw error;
  }
};
