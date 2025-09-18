import { setTimeout as delay } from 'node:timers/promises';
import type WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export class ResilientConnection {
  private reconnectAttempts = 0;
  private readonly maxBackoff = 10_000;

  constructor(private readonly socket: WebSocket) {}

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
