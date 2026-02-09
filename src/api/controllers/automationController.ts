import { Request, Response, NextFunction } from 'express';
import { automationQueue } from '../queues/automation.queue';
import {
  enrichProject,
  enrichProjectAfterFirstPassWithGPT5,
  enrichProjectWithGPT5,
  enrichProjectsBatchWithGPT5,
  findProjectsWithGPT5
} from '../services/automation.service';
import { enrichProjectWithTavily } from '../services/enrichmentTavily.service';
import MessageResponse from '../../interfaces/MessageResponse';

// Trigger project enrichment job
const projectEnrich = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const projectId = req.params.id;

    // Add to queue
    const job = await automationQueue.add('enrich-project', {
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
    const job = await automationQueue.add('enrich-batch', {
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
    const job = await automationQueue.getJob(jobId);

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
  req: Request<{}, {}, { location: string; buildingType: string }>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const { location, buildingType } = req.body;

    if (!location || !buildingType) {
      return res.status(400).json({
        message: 'location and buildingType are required'
      });
    }

    const job = await automationQueue.add('project-search', {
      location,
      buildingType
    });

    res.json({
      message: 'Project search queued',
      jobId: job.id as string,
      location,
      buildingType
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
    const job = await automationQueue.add('enrich-after-first-pass-gpt5', {
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
  projectsFindGPT5,
  projectsFindGPT5Queued,
  projectEnrichGPT5,
  projectEnrichTavily,
  projectEnrichBatchGPT5,
  projectAfterFirstPassEnrichWithGPT5,
  immediateProjectAfterFirstPassEnrichWithGPT5
};
