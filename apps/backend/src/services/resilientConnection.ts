import type { WebSocket } from 'ws';
import { logger } from '../logger.js';

interface ReconnectOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

export class ResilientConnection {
  private attempts = 0;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(private readonly socket: WebSocket, options: ReconnectOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? 5;
    this.baseDelayMs = options.baseDelayMs ?? 500;
  }

  scheduleReconnect(connect: () => Promise<WebSocket>): void {
    if (this.attempts >= this.maxAttempts) {
      logger.error('Maximum reconnection attempts reached');
      return;
    }

    const delay = this.baseDelayMs * 2 ** this.attempts;
    this.attempts += 1;
    logger.warn({ delay }, 'Attempting reconnection');
    this.reconnectTimer = setTimeout(async () => {
      try {
        const newSocket = await connect();
        this.socket.emit('reconnected', newSocket);
        this.attempts = 0;
      } catch (error) {
        logger.error({ error }, 'Reconnection failed');
        this.scheduleReconnect(connect);
      }
    }, delay);
  }

  clear(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.attempts = 0;
  }
}
