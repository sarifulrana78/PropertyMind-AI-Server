import { Router } from 'express';
import { register, login, logout, getMe, updateProfile, toggleSaveProperty } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/save/:propertyId', authenticate, toggleSaveProperty);

export default router;
