import express from 'express';
import {
  projectEnrich,
  projectEnrichImmediate,
  projectEnrichBatch,
  jobStatus,
  stopJob,
  // projectEnrichGPT5,
  // projectEnrichTavily,
  // projectEnrichBatchGPT5,
  projectsFindGPT5,
  projectsFindGPT5Queued,
  projectAfterFirstPassEnrichWithGPT5,
  immediateProjectAfterFirstPassEnrichWithGPT5,
  projectEnrichBatchGPT5
} from '../controllers/enrichmentController';
import passport from 'passport';

const router = express.Router();

// Enrich single project (queued)
router.post(
  '/enrich/:id',
  passport.authenticate('jwt', { session: false }),
  projectEnrich
);

// Enrich single project (immediate)
router.post(
  '/enrich/:id/immediate',
  passport.authenticate('jwt', { session: false }),
  projectEnrichImmediate
);

// Test GPT-5 enrichment
// router.post('/enrich/:id/gpt5', projectEnrichGPT5);

// // Test Tavily enrichment
// router.post('/enrich/:id/tavily', projectEnrichTavily);
// Find Projects no worker
router.post(
  '/find-projects/gpt5',
  passport.authenticate('jwt', { session: false }),
  projectsFindGPT5
);
// Queue GPT-5 project search
router.post(
  '/find-projects/gpt5/queue',
  passport.authenticate('jwt', { session: false }),
  projectsFindGPT5Queued
);
// Enrich projects no worker
router.post(
  '/enrich-batch/gpt5',
  passport.authenticate('jwt', { session: false }),
  projectEnrichBatchGPT5
);

// Batch enrich projects
router.post(
  '/enrich-batch',
  passport.authenticate('jwt', { session: false }),
  projectEnrichBatch
);

router.post(
  '/enrich/:id/after-first-pass/gpt5',
  passport.authenticate('jwt', { session: false }),
  projectAfterFirstPassEnrichWithGPT5
);
router.post(
  '/enrich/:id/after-first-pass/gpt5/immediate',
  passport.authenticate('jwt', { session: false }),
  immediateProjectAfterFirstPassEnrichWithGPT5
);
// Check job status
router.get(
  '/job/:jobId',
  passport.authenticate('jwt', { session: false }),
  jobStatus
);

router.post(
  '/job/:jobId/stop',
  passport.authenticate('jwt', { session: false }),
  stopJob
);
export default router;
