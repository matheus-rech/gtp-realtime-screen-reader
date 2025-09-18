import { describe, expect, it } from 'vitest';
import { ContextManager } from '../services/contextManager.js';

describe('ContextManager', () => {
  it('maintains bounded history and compresses when necessary', async () => {
    const manager = new ContextManager({ visualHistorySize: 3, compressionTrigger: 1 });
    await manager.updateContext('audio one', 'visual one', Date.now());
    await manager.updateContext('audio two', 'visual two', Date.now());
    await manager.updateContext('audio three', 'visual three', Date.now());
    await manager.updateContext('audio four', 'visual four', Date.now());

    const snapshot = manager.getSnapshot();
    expect(snapshot.length).toBeLessThanOrEqual(3);
    expect(snapshot.at(-1)?.audioTranscript).toContain('audio four');
  });
});
