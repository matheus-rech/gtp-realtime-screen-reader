import type { Request, Response } from 'express';

export const healthHandler = (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
};
