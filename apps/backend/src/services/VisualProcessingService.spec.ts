import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ContextManager } from './ContextManager.js';
import { VisualContextCache } from './VisualContextCache.js';
import { VisualProcessingService } from './VisualProcessingService.js';

describe('VisualProcessingService', () => {
  it('processes and describes frames', async () => {
    const contextManager = new ContextManager({
      maxTokens: 1000,
      compressionTrigger: 900,
      visualHistorySize: 5
    });
    const cache = new VisualContextCache({ ttlSeconds: 60, maxEntries: 10 });
    const descriptions: string[] = [];
    const service = new VisualProcessingService(contextManager, cache, {
      onContextReady: async (description) => {
        descriptions.push(description);
      }
    });

    const buffer = await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .png()
      .toBuffer();

    await service.handleFrame(buffer, 'screen', { quick: true });
    expect(descriptions.length).toBe(1);
  });
});
