import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { env } from './env.js';
import { logger } from './logger.js';
import { sessionRouter } from './routes/session.js';
import { createFramesRouter } from './routes/frames.js';
import { VisualRelay } from './lib/visualRelay.js';
import { sessionCache } from './lib/sessionCache.js';

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '5mb' }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: env.maxSessions * 5,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', sessionRouter);

  const server = createServer(app);
  const relay = new VisualRelay(server);
  app.use('/api', createFramesRouter(relay));

  relay.on('broadcast', (payload) => {
    logger.debug({ payload }, 'Broadcasted visual payload');
  });

  const start = async () => {
    await sessionCache.connect();
    return new Promise<void>((resolve) => {
      server.listen(env.port, () => {
        logger.info({ port: env.port }, 'Server listening');
        resolve();
      });
    });
  };

  return { app, server, start };
};
