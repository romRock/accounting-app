import { Request, Response, NextFunction } from 'express';
import { scanInput } from '../utils/inputSecurity';
import { createError } from './errorHandler';

const SKIP_PATH_PREFIXES = ['/health'];

/**
 * Rejects requests containing XSS/SQLi/path-traversal patterns in body, query, or params.
 * Does not alter payloads — only blocks malicious input before route handlers run.
 */
export const inputSecurityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (SKIP_PATH_PREFIXES.some((path) => req.path === path || req.path.startsWith(`${path}/`))) {
    return next();
  }

  const locations: { label: string; data: unknown }[] = [
    { label: 'body', data: req.body },
    { label: 'query', data: req.query },
    { label: 'params', data: req.params },
  ];

  for (const { label, data } of locations) {
    if (data === undefined || data === null) continue;
    const hit = scanInput(data, label);
    if (hit) {
      console.warn('Blocked suspicious input', {
        method: req.method,
        path: req.path,
        location: hit.location,
        ip: req.ip,
      });
      return next(createError('Invalid input', 400));
    }
  }

  next();
};
