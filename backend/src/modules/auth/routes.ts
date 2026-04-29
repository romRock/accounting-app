import { Router } from 'express';
import { login, logout, refreshToken, getProfile } from './controller';
import { authenticateToken } from './middleware';
import { validateLogin } from './validation';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
