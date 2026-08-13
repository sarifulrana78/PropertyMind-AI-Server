import { Router } from 'express';
import { getMarketStats, getPriceTrends } from '../controllers/analytics.controller';

const router = Router();

router.get('/market-stats', getMarketStats);
router.get('/price-trends', getPriceTrends);

export default router;
