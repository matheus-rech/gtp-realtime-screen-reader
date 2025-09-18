import { describe, expect, it } from 'vitest';
import { DualQueue } from '../dualQueue';

describe('DualQueue', () => {
  it('queues audio and visual payloads independently', async () => {
    const queue = new DualQueue<string, string>();
    queue.audioQueue.enqueue('audio-1');
    queue.visualQueue.enqueue('visual-1');

    const audio = await queue.audioQueue.dequeue();
    const visual = await queue.visualQueue.dequeue();

    expect(audio).toBe('audio-1');
    expect(visual).toBe('visual-1');
  });
});
