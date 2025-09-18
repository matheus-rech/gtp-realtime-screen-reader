import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createSessionHandler } from './routes/session.js';
import { healthHandler } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(compression());

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/health', healthHandler);
  app.post('/api/session', createSessionHandler);

  app.use(errorHandler);

  return app;
};
