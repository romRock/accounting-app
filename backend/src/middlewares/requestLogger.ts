import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || '';

  
  // Store request start time for response time calculation
  req.startTime = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - (req.startTime || Date.now());
  });

  next();
};

// Extend Request interface to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}
