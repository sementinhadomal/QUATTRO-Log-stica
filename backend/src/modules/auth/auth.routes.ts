import { Router } from 'express';
import {
  login,
  logout,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  changePassword,
  terminateAllSessions,
} from './auth.controller';
import { loginRateLimiter } from '../../middleware/rateLimiter';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// Public routes
router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.post('/recuperar-senha', requestPasswordReset);
router.post('/redefinir-senha', resetPassword);

// Protected routes
router.get('/me', requireAuth, getCurrentUser);
router.put('/trocar-senha', requireAuth, changePassword);
router.post('/encerrar-sessoes/:targetUserId?', requireAuth, terminateAllSessions);

export default router;
