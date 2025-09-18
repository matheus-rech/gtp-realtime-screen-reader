import type { Request, Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../env.js';
import { openai } from '../lib/openai.js';
import { sessionCache } from '../lib/sessionCache.js';
import { logger } from '../logger.js';

interface SessionRequestBody {
  mode?: 'screen' | 'camera' | 'hybrid';
  instructions?: string;
}

const limiter = rateLimit({
  windowMs: 60_000,
  max: env.maxSessions,
  standardHeaders: true,
  legacyHeaders: false
});

export const sessionRouter = Router();

sessionRouter.post('/session', limiter, async (req: Request<unknown, unknown, SessionRequestBody>, res: Response) => {
  try {
    const { mode = 'screen', instructions } = req.body ?? {};

    if (!env.openaiApiKey) {
      return res.status(500).json({ error: 'Server misconfigured: missing OpenAI API key' });
    }

    const session = await openai.realtime.sessions.create({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'marin',
      instructions: instructions ??
        'You are a helpful assistant with real-time visual perception. Reference visual context when asked.',
      modalities: ['text', 'audio'],
      tools: [
        {
          name: 'analyze_screen',
          description: 'Analyze current screen content',
          parameters: {
            type: 'object',
            properties: {
              region: {
                type: 'string'
              }
            }
          }
        }
      ]
    });

    const sessionId = session.id;
    await sessionCache.setState({ sessionId, mode });

    logger.info({ sessionId, mode }, 'Created ephemeral session');
    return res.json({ client_secret: session.client_secret });
  } catch (error) {
    logger.error({ error }, 'Failed to create realtime session');
    return res.status(500).json({ error: 'Failed to create realtime session' });
  }
});
