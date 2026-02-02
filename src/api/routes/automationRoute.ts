import express from 'express';
import {
  projectEnrich,
  projectEnrichImmediate,
  projectEnrichBatch,
  jobStatus
} from '../controllers/automationController';

const router = express.Router();

// Enrich single project (queued)
router.post('/enrich/:id', projectEnrich);

// Enrich single project (immediate)
router.post('/enrich/:id/immediate', projectEnrichImmediate);

// Batch enrich projects
router.post('/enrich-batch', projectEnrichBatch);

// Check job status
router.get('/job/:jobId', jobStatus);

export default router;
