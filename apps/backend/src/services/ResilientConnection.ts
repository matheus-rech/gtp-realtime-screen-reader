import { setTimeout as delay } from 'node:timers/promises';
import type WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export class ResilientConnection {
  private reconnectAttempts = 0;
  private readonly maxBackoff = 10_000;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_socket: WebSocket) {
    // Socket parameter preserved for future resilient connection features
    // Currently not used as connection management is handled externally
  }

  async handleDisconnect(): Promise<void> {
    this.reconnectAttempts += 1;
    const backoff = Math.min(this.reconnectAttempts * 1000, this.maxBackoff);
    logger.warn('WebSocket disconnected, attempting reconnection', { backoff });
    await delay(backoff);
  }

  reset(): void {
    this.reconnectAttempts = 0;
  }

  async handleRateLimit(): Promise<void> {
    logger.warn('Rate limit hit, backing off visual updates');
    await delay(1000);
  }
}
