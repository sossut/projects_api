import { Request, Response, NextFunction } from 'express';
import { automationQueue } from '../queues/automation.queue';
import { enrichProject } from '../services/automation.service';
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

export { projectEnrich, projectEnrichImmediate, projectEnrichBatch, jobStatus };
