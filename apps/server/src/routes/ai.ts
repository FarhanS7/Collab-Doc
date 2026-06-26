import { Router } from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

// Apply a rolling rate limit of 10 requests per user per 60 seconds (1 minute)
router.post('/complete', rateLimit({ windowMs: 60000, max: 10 }), aiController.generateAISuggestion);

const aiRouter: Router = router;
export { aiRouter };
