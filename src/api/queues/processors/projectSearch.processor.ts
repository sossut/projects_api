import { Job } from 'bullmq';
import {
  discoverProjects,
  findProjectsWithGPT5
} from '../../services/automation.service';
import { postSearch, putSearch } from '../../models/searchModel';
import { findMetroAreaIdByName } from '../../../utils/utilities';

import { enrichmentQueue } from '../enrichment.queue';

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
    // Posting to searches table
    let searchId;

    const metroAreaId = await findMetroAreaIdByName(location);
    if (location && metroAreaId) {
      searchId = await postSearch({
        targetType: 'metro_area',
        targetId: metroAreaId || 0,
        startedAt: new Date()
      });
    }

    // Run GPT-5 first-pass search when location/buildingType is provided
    const results =
      location || buildingType
        ? await findProjectsWithGPT5(location || '', buildingType || '')
        : await discoverProjects(query);

    await job.updateProgress(100);
    if (searchId) {
      // Update search record with finishedAt and result count
      await putSearch(
        {
          finishedAt: new Date(),
          status: 'completed'
        },
        searchId
      );
    }

    if (
      'newFirstPassProjectIds' in results &&
      Array.isArray(results.newFirstPassProjectIds)
    ) {
      for (const projectId of results.newFirstPassProjectIds) {
        await enrichmentQueue.add('enrich-after-first-pass-gpt5', {
          projectId
        });
      }
    }
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
