import { Router } from 'express';
import { login, logout, refreshToken, getProfile } from './controller';
import { authenticateToken } from './middleware';
import { validateLogin, validateRefreshToken } from './validation';

const router = Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/refresh', validateRefreshToken, refreshToken);

// Logout uses refresh token (no access token required when session already expired)
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router;
