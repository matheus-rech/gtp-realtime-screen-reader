import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { VisualProcessor } from '../services/visualProcessor.js';

describe('VisualProcessor', () => {
  it('resizes frames to maximum resolution and stores history', async () => {
    const processor = new VisualProcessor({ maxResolution: 64, historySize: 2 });
    const imageBuffer = await sharp({
      create: {
        width: 256,
        height: 128,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
      .png()
      .toBuffer();

    const frame = await processor.captureFrame(imageBuffer, 'screen');
    expect(frame.width).toBeLessThanOrEqual(64);
    expect(frame.height).toBeLessThanOrEqual(64);
    expect(processor.history).toHaveLength(1);

    await processor.captureFrame(imageBuffer, 'camera');
    await processor.captureFrame(imageBuffer, 'screen');
    expect(processor.history).toHaveLength(2);
  });
});
