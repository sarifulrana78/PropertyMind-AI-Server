import { Router } from 'express';
import {
  getProperties, getProperty, createProperty, updateProperty,
  deleteProperty, getMyProperties, addReview, getFeaturedProperties,
} from '../controllers/property.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);
router.get('/mine', authenticate, getMyProperties);
router.get('/:id', getProperty);
router.post('/', authenticate, createProperty);
router.put('/:id', authenticate, updateProperty);
router.delete('/:id', authenticate, deleteProperty);
router.post('/:id/reviews', authenticate, addReview);

export default router;
