import crypto from 'node:crypto';
import NodeCache from 'node-cache';

export type CachedVisual = {
  hash: string;
  description: string;
  timestamp: number;
};

type VisualContextCacheOptions = {
  ttlSeconds: number;
  maxEntries: number;
};

export class VisualContextCache {
  private readonly cache: NodeCache;

  constructor(private readonly options: VisualContextCacheOptions) {
    this.cache = new NodeCache({ stdTTL: options.ttlSeconds, checkperiod: options.ttlSeconds / 2 });
  }

  hashFrame(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  get(hash: string): CachedVisual | undefined {
    return this.cache.get<CachedVisual>(hash);
  }

  set(hash: string, description: string): void {
    if (this.cache.keys().length >= this.options.maxEntries) {
      const oldestKey = this.cache.keys().sort(
        (a, b) => (this.cache.getTtl(a) ?? 0) - (this.cache.getTtl(b) ?? 0)
      )[0];
      if (oldestKey) {
        this.cache.del(oldestKey);
      }
    }

    this.cache.set(hash, { hash, description, timestamp: Date.now() });
  }
}
