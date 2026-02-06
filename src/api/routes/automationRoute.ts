import express from 'express';
import {
  // projectEnrich,
  // projectEnrichImmediate,
  // projectEnrichBatch,
  // jobStatus,
  projectEnrichGPT5,
  projectEnrichTavily,
  projectEnrichBatchGPT5,
  projectsFindGPT5
} from '../controllers/automationController';

const router = express.Router();

// Enrich single project (queued)
// router.post('/enrich/:id', projectEnrich);

// Enrich single project (immediate)
// router.post('/enrich/:id/immediate', projectEnrichImmediate);

// Test GPT-5 enrichment
router.post('/enrich/:id/gpt5', projectEnrichGPT5);

// Test Tavily enrichment
router.post('/enrich/:id/tavily', projectEnrichTavily);
// Test GPT-5 project search
router.post('/find-projects/gpt5', projectsFindGPT5);
// Test GPT-5 batch enrichment
router.post('/enrich-batch/gpt5', projectEnrichBatchGPT5);

// Batch enrich projects
// router.post('/enrich-batch', projectEnrichBatch);

// Check job status
// router.get('/job/:jobId', jobStatus);

export default router;
