import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/** Hide debug/seed/test routes in production unless explicitly enabled. */
export const devEndpointsOnly = (_req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_ENDPOINTS !== 'true') {
    return res.status(404).json({ error: 'Route not found' });
  }
  next();
};

/** Stricter limit for login brute-force protection. */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

/** Generous global limit — accountants make many requests during a session. */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

/** Avoid leaking internal error details in production API responses. */
export function safeErrorDetail(error: unknown): string | undefined {
  if (process.env.NODE_ENV === 'development' && error instanceof Error) {
    return error.message;
  }
  return undefined;
}
