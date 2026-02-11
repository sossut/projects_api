import { Job } from 'bullmq';
import {
  enrichProject,
  enrichProjectAfterFirstPassWithGPT5,
  enrichProjectsBatch
} from '../../services/automation.service';
import { postSearch, putSearch } from '../../models/searchModel';

// Process single project enrichment
export const processProjectEnrichment = async (job: Job) => {
  const { projectId } = job.data;

  console.log(`Processing enrichment for project ID: ${projectId}`);

  await job.updateProgress(10);

  try {
    const newSearch = await postSearch({
      targetType: 'project',
      targetId: projectId,
      startedAt: new Date()
    });
    const result = await enrichProject(projectId);

    await job.updateProgress(100);
    if (result) {
      // Update search record with finishedAt and result count
      await putSearch(
        {
          finishedAt: new Date(),
          status: 'completed',
          fieldsUpdated: (result.fieldsUpdated as any) || []
        },
        newSearch
      );
    }
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

  await job.updateProgress(5);

  const searchIds = new Map<number, number>();

  for (const projectId of projectIds) {
    const searchId = await postSearch({
      targetType: 'project',
      targetId: projectId,
      startedAt: new Date()
    });
    searchIds.set(projectId, searchId);
  }

  try {
    const results = await enrichProjectsBatch(projectIds);

    await job.updateProgress(100);

    const resultsByProjectId = new Map<number, any>();
    for (const entry of results.results) {
      if (typeof entry.projectId === 'number') {
        resultsByProjectId.set(entry.projectId, entry);
      }
    }

    for (const projectId of projectIds) {
      const searchId = searchIds.get(projectId);
      if (searchId) {
        const entry = resultsByProjectId.get(projectId);
        await putSearch(
          {
            finishedAt: new Date(),
            status: 'completed',
            fieldsUpdated: entry?.fieldsUpdated || []
          },
          searchId
        );
      }
    }

    return {
      success: true,
      ...results
    };
  } catch (error) {
    console.error('Batch enrichment failed:', error);

    for (const projectId of projectIds) {
      const searchId = searchIds.get(projectId);
      if (searchId) {
        await putSearch(
          {
            finishedAt: new Date(),
            status: 'failed',
            errorText: String(error)
          },
          searchId
        );
      }
    }

    throw error;
  }
};

export const processFirstPassProjectEnrichment = async (job: Job) => {
  const { firstPassProjectId } = job.data;

  console.log(
    `Processing first pass enrichment for project ID: ${firstPassProjectId}`
  );

  await job.updateProgress(10);
  try {
    const newSearch = await postSearch({
      targetType: 'project_first_pass',
      targetId: firstPassProjectId,
      startedAt: new Date()
    });
    const result =
      await enrichProjectAfterFirstPassWithGPT5(firstPassProjectId);

    await job.updateProgress(100);

    if (result) {
      await putSearch(
        {
          finishedAt: new Date(),
          status: 'completed',
          fieldsUpdated: Object.keys(result) as any[]
        },
        newSearch
      );
    }
    return {
      success: true,
      ...result
    };
  } catch (error) {
    console.error(
      `First pass enrichment failed for project ${firstPassProjectId}:`,
      error
    );
    throw error;
  }
};
