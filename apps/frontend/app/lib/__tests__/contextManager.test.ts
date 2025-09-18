import { describe, expect, it } from 'vitest';
import { ContextManager } from '../contextManager';

describe('ContextManager', () => {
  it('summarizes audio and visual context', async () => {
    const manager = new ContextManager({ visualHistorySize: 2 });
    await manager.update('Hello world', 'A bright screen', Date.now());
    await manager.update('User asked question', 'Cursor near error message', Date.now());

    const summary = manager.summary();
    expect(summary).toContain('Hello world');
    expect(summary).toContain('Cursor near error message');
  });
});
