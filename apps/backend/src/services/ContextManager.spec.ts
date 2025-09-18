import { describe, expect, it } from 'vitest';
import { ContextManager } from './ContextManager.js';

describe('ContextManager', () => {
  it('stores audio and visual context with compression', () => {
    const manager = new ContextManager({ maxTokens: 128, compressionTrigger: 64, visualHistorySize: 2 });

    const now = Date.now();
    manager.updateContext('audio message', 'visual message one', now);
    manager.updateContext(undefined, 'visual message two', now + 1);
    manager.updateContext(undefined, 'visual message three', now + 2);

    const contexts = manager.updateContext('another audio', undefined, now + 3);
    const visualEntries = contexts.filter((entry) => entry.type === 'visual');

    expect(visualEntries).toHaveLength(2);
    expect(contexts.some((entry) => entry.type === 'audio')).toBe(true);
  });
});
