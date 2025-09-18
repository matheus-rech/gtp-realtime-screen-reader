import Redis from 'ioredis';
import { env } from '../env.js';
import { logger } from '../logger.js';

export interface SessionState {
  sessionId: string;
  mode: 'screen' | 'camera' | 'hybrid';
  lastVisualUpdate?: number;
  lastAudioUpdate?: number;
}

export class SessionCache {
  private readonly redis?: Redis;

  constructor() {
    if (env.redisUrl) {
      this.redis = new Redis(env.redisUrl, {
        lazyConnect: true
      });
      this.redis.on('error', (error) => logger.error({ error }, 'Redis error'));
    }
  }

  async connect(): Promise<void> {
    if (this.redis && this.redis.status === 'wait') {
      await this.redis.connect();
      logger.info('Connected to Redis');
    }
  }

  async disconnect(): Promise<void> {
    await this.redis?.quit();
  }

  async setState(state: SessionState): Promise<void> {
    if (!this.redis) {
      return;
    }
    await this.redis.setex(`session:${state.sessionId}`, 60 * 60, JSON.stringify(state));
  }

  async getState(sessionId: string): Promise<SessionState | null> {
    if (!this.redis) {
      return null;
    }
    const payload = await this.redis.get(`session:${sessionId}`);
    return payload ? (JSON.parse(payload) as SessionState) : null;
  }
}

export const sessionCache = new SessionCache();
