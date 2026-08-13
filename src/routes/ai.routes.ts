import { Router } from 'express';
import { advisorChat, generateDescription, generateMarketAnalysis } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/advisor', authenticate, advisorChat);
router.post('/generate-description', authenticate, generateDescription);
router.post('/market-analysis', generateMarketAnalysis);

export default router;
