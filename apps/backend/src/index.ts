import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import WebSocket, { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { env } from './utils/env.js';
import { logger } from './utils/logger.js';
import { ContextManager } from './services/ContextManager.js';
import { VisualContextCache } from './services/VisualContextCache.js';
import { VisualProcessingService } from './services/VisualProcessingService.js';
import { DualQueue } from './queues/DualQueue.js';
import { ResilientConnection } from './services/ResilientConnection.js';

const app = createApp();
const server = createServer(app);

const contextManager = new ContextManager({
  maxTokens: 128_000,
  compressionTrigger: 100_000,
  visualHistorySize: 10
});

const cache = new VisualContextCache({ ttlSeconds: 60, maxEntries: 50 });

const wss = new WebSocketServer({ server, path: '/visual' });

wss.on('connection', (socket: WebSocket) => {
  logger.info('Visual WebSocket client connected');
  const connection = new ResilientConnection(socket);
  const queue = new DualQueue<unknown>({
    onClear: () => logger.debug('Queues cleared after interruption')
  });

  const processor = new VisualProcessingService(contextManager, cache, {
    onContextReady: async (description, frame) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'visual-context',
            description,
            frame: {
              capturedAt: frame.capturedAt,
              source: frame.source,
              width: frame.width,
              height: frame.height
            }
          })
        );
      }
    }
  });

  socket.on('message', async (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as {
        type: string;
        payload?: unknown;
      };

      if (data.type === 'frame') {
        const payload = data.payload as { base64: string; source: 'screen' | 'camera'; quick?: boolean };
        const buffer = Buffer.from(payload.base64, 'base64');
        queue.enqueueVisual({ id: randomUUID(), payload, timestamp: Date.now() });
        await processor.handleFrame(buffer, payload.source, { quick: payload.quick });
        return;
      }

      if (data.type === 'audio') {
        queue.enqueueAudio({ id: randomUUID(), payload: data.payload, timestamp: Date.now() });
        return;
      }

      if (data.type === 'interrupt') {
        queue.clearAudio();
        queue.pauseVisual();
        socket.send(JSON.stringify({ type: 'interrupted' }));
        return;
      }

      if (data.type === 'resume-visual') {
        queue.resumeVisual();
        return;
      }

      logger.warn('Unknown message type received', { type: data.type });
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { error });
    }
  });

  socket.on('close', () => {
    connection.reset();
    logger.info('Visual WebSocket client disconnected');
  });

  socket.on('error', async () => {
    await connection.handleDisconnect();
  });
});

server.listen(env.port, () => {
  logger.info(`Backend listening on http://localhost:${env.port}`);
});
