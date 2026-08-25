import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// ─── Login Rate Limiter ───────────────────────────────────────────────────────
export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_WINDOW_MINUTES * 60 * 1000,
  max: env.LOGIN_MAX_ATTEMPTS,
  message: {
    error: `Muitas tentativas de login. Tente novamente em ${env.LOGIN_WINDOW_MINUTES} minutos.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combination
    const email = req.body?.email || '';
    return `${req.ip}_${email.toLowerCase()}`;
  },
  skip: (req) => {
    // Never skip in production
    return false;
  },
});

// ─── General API Rate Limiter ─────────────────────────────────────────────────
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Upload Rate Limiter ──────────────────────────────────────────────────────
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Muitos uploads. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Muitas solicitações de redefinição. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});
