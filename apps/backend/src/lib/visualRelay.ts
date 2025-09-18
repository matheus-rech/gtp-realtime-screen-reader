import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { logger } from '../logger.js';

interface VisualPayload {
  description: string;
  frameBase64: string;
  capturedAt: number;
}

export class VisualRelay extends EventEmitter {
  private readonly wss: WebSocketServer;
  private readonly clients = new Set<WebSocket>();

  constructor(server: Server) {
    super();
    this.wss = new WebSocketServer({ server, path: '/ws/visual' });
    this.wss.on('connection', (socket) => {
      this.clients.add(socket);
      logger.info('Client connected to visual relay');
      socket.on('close', () => {
        this.clients.delete(socket);
        logger.info('Client disconnected from visual relay');
      });
    });
  }

  broadcast(payload: VisualPayload): void {
    const serialized = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) {
        client.send(serialized);
      }
    }
    this.emit('broadcast', payload);
  }
}
