import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;

  if (status >= 500) {
    logger.error('Server error', { err });
  } else {
    logger.warn('Client error', { err });
  }

  res.status(status).json({ error: message, details });
}
