import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  logger.error('Unhandled error in request pipeline', { error });
  res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
};
