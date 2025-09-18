import crypto from 'node:crypto';

type SourceType = 'screen' | 'camera';

interface CacheEntry {
  hash: string;
  description: string;
  updatedAt: number;
  source: SourceType;
}

export class FrameCache {
  private readonly entries = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = 5_000) {}

  getOrCreate(base64: string, source: SourceType, describe: () => string): CacheEntry {
    const hash = crypto.createHash('sha1').update(base64).digest('hex');
    const existing = this.entries.get(hash);
    if (existing && Date.now() - existing.updatedAt < this.ttlMs) {
      return existing;
    }
    const description = describe();
    const entry: CacheEntry = { hash, description, updatedAt: Date.now(), source };
    this.entries.set(hash, entry);
    return entry;
  }
}
