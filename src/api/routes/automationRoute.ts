import express from 'express';
import {
  // projectEnrich,
  // projectEnrichImmediate,
  // projectEnrichBatch,
  jobStatus,
  stopJob
  // projectEnrichGPT5,
  // projectEnrichTavily,
  // projectEnrichBatchGPT5,
  // projectsFindGPT5,
  // projectsFindGPT5Queued,
  // projectAfterFirstPassEnrichWithGPT5,
  // immediateProjectAfterFirstPassEnrichWithGPT5,
  // projectEnrichBatchGPT5
} from '../controllers/automationController';
import passport from 'passport';
const router = express.Router();

// // Enrich single project (queued)
// router.post('/enrich/:id', projectEnrich);

// // Enrich single project (immediate)
// router.post('/enrich/:id/immediate', projectEnrichImmediate);

// // Test GPT-5 enrichment
// // router.post('/enrich/:id/gpt5', projectEnrichGPT5);

// // Test Tavily enrichment
// router.post('/enrich/:id/tavily', projectEnrichTavily);
// // Find Projects no worker
// router.post('/find-projects/gpt5', projectsFindGPT5);
// // Queue GPT-5 project search
// router.post('/find-projects/gpt5/queue', projectsFindGPT5Queued);
// // Enrich projects no worker
// router.post('/enrich-batch/gpt5', projectEnrichBatchGPT5);

// // Batch enrich projects
// router.post('/enrich-batch', projectEnrichBatch);

// router.post(
//   '/enrich/:id/after-first-pass/gpt5',
//   projectAfterFirstPassEnrichWithGPT5
// );
// router.post(
//   '/enrich/:id/after-first-pass/gpt5/immediate',
//   immediateProjectAfterFirstPassEnrichWithGPT5
// );
// Check job status
router.get(
  '/job/:jobId',
  passport.authenticate('jwt', { session: false }),
  jobStatus
);
// Stop job
router.post(
  '/job/:jobId/stop',
  passport.authenticate('jwt', { session: false }),
  stopJob
);
export default router;
