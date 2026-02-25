import { Router, Request, Response } from 'express';
import { enrichmentQueue } from '../queues/enrichment.queue';
import { automationQueue } from '../queues/automation.queue';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [
      enrichmentCounts,
      enrichmentWaiting,
      enrichmentActive,
      enrichmentCompleted,
      enrichmentFailed,
      automationCounts,
      automationWaiting,
      automationActive,
      automationCompleted,
      automationFailed
    ] = await Promise.all([
      enrichmentQueue.getJobCounts(),
      enrichmentQueue.getWaiting(),
      enrichmentQueue.getActive(),
      enrichmentQueue.getCompleted(),
      enrichmentQueue.getFailed(),
      automationQueue.getJobCounts(),
      automationQueue.getWaiting(),
      automationQueue.getActive(),
      automationQueue.getCompleted(),
      automationQueue.getFailed()
    ]);

    res.json({
      enrichmentQueue: {
        counts: enrichmentCounts,
        waiting: enrichmentWaiting,
        active: enrichmentActive,
        completed: enrichmentCompleted,
        failed: enrichmentFailed
      },
      automationQueue: {
        counts: automationCounts,
        waiting: automationWaiting,
        active: automationActive,
        completed: automationCompleted,
        failed: automationFailed
      }
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Failed to fetch queue info', details: String(error) });
  }
});

export default router;
