import type { Request, Response } from 'express';
import { Router } from 'express';
import type { VisualRelay } from '../lib/visualRelay.js';
import { ContextManager } from '../services/contextManager.js';
import { FrameCache } from '../services/frameCache.js';
import { VisualMemory } from '../services/visualMemory.js';
import { VisualProcessor } from '../services/visualProcessor.js';
import { logger } from '../logger.js';

const contextManager = new ContextManager();
const visualProcessor = new VisualProcessor();
const frameCache = new FrameCache();
const visualMemory = new VisualMemory();

interface FramePayload {
  frame: string; // base64
  source: 'screen' | 'camera';
  transcriptSnippet?: string;
}

export const createFramesRouter = (relay?: VisualRelay) => {
  const router = Router();

  router.post('/frames/analyze', async (req: Request<unknown, unknown, FramePayload>, res: Response) => {
    try {
      const { frame, source, transcriptSnippet } = req.body ?? {};
      if (!frame || !source) {
        return res.status(400).json({ error: 'Missing frame or source' });
      }

      const buffer = Buffer.from(frame, 'base64');
      const processed = await visualProcessor.captureFrame(buffer, source);

      const cacheEntry = frameCache.getOrCreate(processed.base64, processed.source, () => {
        return `Frame captured from ${source} at ${new Date(processed.capturedAt).toLocaleTimeString()}`;
      });

      await contextManager.updateContext(transcriptSnippet ?? '', cacheEntry.description, processed.capturedAt);

      await visualMemory.store(processed.base64, cacheEntry.description, buildMockEmbedding(processed.base64));

      relay?.broadcast({
        description: cacheEntry.description,
        frameBase64: processed.base64,
        capturedAt: processed.capturedAt
      });

      return res.json({
        description: cacheEntry.description,
        frame: processed,
        contextWindow: contextManager.getSnapshot()
      });
    } catch (error) {
      logger.error({ error }, 'Failed to analyze frame');
      return res.status(500).json({ error: 'Failed to analyze frame' });
    }
  });

  return router;
};

const buildMockEmbedding = (base64: string): number[] => {
  const bytes = Buffer.from(base64.slice(0, 64));
  const embedding: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    embedding.push(bytes.at(i)! / 255);
  }
  return embedding;
};
