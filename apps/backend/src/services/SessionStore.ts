import { createClient, type RedisClientType } from 'redis';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

type SessionRecord = {
  id: string;
  createdAt: number;
  lastSeen: number;
  mode: 'screen' | 'camera' | 'hybrid';
};

export class SessionStore {
  private redis: RedisClientType | null = null;
  private readonly fallbackStore = new Map<string, SessionRecord>();

  constructor() {
    if (env.redisUrl) {
      const client = createClient({ url: env.redisUrl });
      client.on('error', (error) => logger.error('Redis connection error', { error }));
      client.connect().catch((error) => logger.error('Failed to connect to Redis', { error }));
      this.redis = client as RedisClientType;
    }
  }

  async create(record: SessionRecord): Promise<void> {
    if (this.redis) {
      await this.redis.set(this.key(record.id), JSON.stringify(record), {
        EX: 60 * 60
      });
      return;
    }
    this.fallbackStore.set(record.id, record);
  }

  async get(id: string): Promise<SessionRecord | null> {
    if (this.redis) {
      const raw = await this.redis.get(this.key(id));
      return raw ? (JSON.parse(raw) as SessionRecord) : null;
    }
    return this.fallbackStore.get(id) ?? null;
  }

  async updateLastSeen(id: string): Promise<void> {
    const record = await this.get(id);
    if (!record) {
      return;
    }
    record.lastSeen = Date.now();
    await this.create(record);
  }

  async count(): Promise<number> {
    if (this.redis) {
      const keys = await this.redis.keys(this.key('*'));
      return keys.length;
    }
    return this.fallbackStore.size;
  }

  private key(id: string): string {
    return `session:${id}`;
  }
}
