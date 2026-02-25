/* eslint-disable @typescript-eslint/indent */
import { Request, Response, NextFunction } from 'express';

import {
  enrichProject,
  enrichProjectAfterFirstPassWithGPT5,
  enrichProjectWithGPT5,
  enrichProjectsBatchWithGPT5,
  findProjectsWithGPT5
} from '../services/automation.service';
import { enrichProjectWithTavily } from '../services/enrichmentTavily.service';
import MessageResponse from '../../interfaces/MessageResponse';
import { checkCountryExistsByName } from '../models/countryModel';
import { findMetroAreaIdByName } from '../../utils/utilities';
import { postMetroArea } from '../models/metroAreaModel';
import { enrichmentQueue } from '../queues/enrichment.queue';

// Trigger project enrichment job
const projectEnrich = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;

    // Add to queue
    const job = await enrichmentQueue.add('enrich-project', {
      projectId
    });

    res.json({
      message: 'Project enrichment started',
      jobId: job.id as string,
      id: projectId
    });
  } catch (err) {
    next(err);
  }
};

// Enrich project immediately (no queue)
const projectEnrichImmediate = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const result = await enrichProject(projectId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Batch enrich multiple projects
const projectEnrichBatch = async (
  req: Request<{}, {}, { projectIds: number[] }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        message: 'projectIds must be a non-empty array'
      });
    }

    // Add batch job to queue
    const job = await enrichmentQueue.add('enrich-batch', {
      projectIds
    });

    res.json({
      message: `Batch enrichment started for ${projectIds.length} projects`,
      jobId: job.id as string,
      projectCount: projectIds.length
    });
  } catch (err) {
    next(err);
  }
};

// Get job status
const jobStatus = async (
  req: Request<{ jobId: string }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const job = await enrichmentQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;

    res.json({
      jobId,
      state,
      progress,
      result,
      failedReason: job.failedReason
    });
  } catch (err) {
    next(err);
  }
};

const stopJob = async (
  req: Request<{ jobId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobId } = req.params;
    const job = await enrichmentQueue.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    await job.remove();
    res.json({ message: 'Job stopped and removed', jobId });
  } catch (err) {
    next(err);
  }
};

// Enrich project with GPT-5 immediately (for testing)
const projectEnrichGPT5 = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const result = await enrichProjectWithGPT5(projectId);
    res.json({
      message: 'Project enriched with GPT-5 successfully',
      id: projectId,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// Enrich project with Tavily immediately (for testing)
const projectEnrichTavily = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;
    const result = await enrichProjectWithTavily(projectId);
    res.json({
      message: 'Project enriched with Tavily successfully',
      id: projectId,
      ...result
    });
  } catch (err) {
    next(err);
  }
};
//immediate batch enrich with GPT-5 (for testing)
const projectsFindGPT5 = async (
  req: Request<{}, {}, { location: string; buildingType: string }>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const { location, buildingType } = req.body;
    const result = await findProjectsWithGPT5(location, buildingType);
    res.json({
      message: 'Projects found with GPT-5 successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
};

// Queue GPT-5 project search
const projectsFindGPT5Queued = async (
  req: Request<
    {},
    {},
    { location: string; buildingTypes: string[]; country: string }
  >,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const { location, buildingTypes, country } = req.body;

    if (!location || !buildingTypes || !country) {
      return res.status(400).json({
        message: 'location, buildingType, and country are required'
      });
    }
    let countryId = await checkCountryExistsByName(country);
    if (countryId === 0) {
      return res.status(400).json({
        message: `Country '${country}' not found`
      });
    }

    // Accept only 'Greater <location> Area' or '<location> Metropolitan Area' formats, otherwise append 'Metropolitan Area'
    let formattedLocation = location.trim();
    // const greaterAreaPattern = /^Greater\s+.+\s+Area$/i;
    // const metroAreaPattern = /^.+\s+Metropolitan\s+Area$/i;
    // if (
    //   !greaterAreaPattern.test(formattedLocation) &&
    //   !metroAreaPattern.test(formattedLocation)
    // ) {
    //   res.json({
    //     message: `Location '${location}' does not match expected formats. Please use 'Greater <location> Area' or '<location> Metropolitan Area'.`
    //   });
    //   return;
    // }
    let metroAreaId = await findMetroAreaIdByName(formattedLocation);
    if (!metroAreaId) {
      metroAreaId = await postMetroArea({
        name: formattedLocation,
        countryId,
        lastSearchedAt: new Date(Date.now())
      });
    }
    const jobIds = [] as string[];
    buildingTypes.forEach(async (buildingType) => {
      const job = await enrichmentQueue.add('project-search', {
        location: formattedLocation,
        buildingType
      });
      jobIds.push(job.id as string);
      console.log(
        `Queued project search for ${formattedLocation} (${buildingType}) with job ID ${job.id}`
      );
    });
    // const job = await enrichmentQueue.add('project-search', {
    //   location: formattedLocation,
    //   buildingType
    // });

    res.json({
      message: 'Project search queued',
      jobIds,
      location: formattedLocation,
      buildingTypes: buildingTypes.join(', ')
    });
  } catch (err) {
    next(err);
  }
};

// Batch enrich multiple projects with GPT-5 immediately (for testing)
const projectEnrichBatchGPT5 = async (
  req: Request<{}, {}, { projectIds: number[] }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        message: 'projectIds must be a non-empty array'
      });
    }

    const result = await enrichProjectsBatchWithGPT5(projectIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const projectAfterFirstPassEnrichWithGPT5 = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const fPProjectId = req.params.id;
    // Add to queue for background processing
    const job = await enrichmentQueue.add('enrich-after-first-pass-gpt5', {
      fPProjectId
    });
    res.json({
      message: 'Project enrichment after first pass with GPT-5 started',
      jobId: job.id as string,
      id: fPProjectId
    });
  } catch (err) {
    next(err);
  }
};

const immediateProjectAfterFirstPassEnrichWithGPT5 = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const fPProjectId = req.params.id;
    const result = await enrichProjectAfterFirstPassWithGPT5(
      Number(fPProjectId)
    );
    res.json({
      message: 'Project enrichment after first pass with GPT-5 completed',
      id: fPProjectId,
      ...(typeof result === 'object' && result !== null ? result : { result })
    });
  } catch (err) {
    next(err);
  }
};

export {
  projectEnrich,
  projectEnrichImmediate,
  projectEnrichBatch,
  jobStatus,
  stopJob,
  projectsFindGPT5,
  projectsFindGPT5Queued,
  projectEnrichGPT5,
  projectEnrichTavily,
  projectEnrichBatchGPT5,
  projectAfterFirstPassEnrichWithGPT5,
  immediateProjectAfterFirstPassEnrichWithGPT5
};
