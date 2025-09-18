import { describe, expect, it } from 'vitest';
import { VisualContextCache } from './VisualContextCache.js';

describe('VisualContextCache', () => {
  it('caches visual descriptions by hash', () => {
    const cache = new VisualContextCache({ ttlSeconds: 60, maxEntries: 2 });
    const hash = cache.hashFrame(Buffer.from('data'));
    cache.set(hash, 'description');

    const result = cache.get(hash);
    expect(result?.description).toBe('description');
  });
});
