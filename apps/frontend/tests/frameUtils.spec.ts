import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { computeFrameDiff, cropToRegion, detectActiveRegion } from '@/lib/visual/frameUtils';

describe('frameUtils', () => {
  const mockContext = {
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: ''
  } as unknown as CanvasRenderingContext2D;

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  const createImageData = (width: number, height: number, value: number) => {
    const data = new Uint8ClampedArray(width * height * 4);
    data.fill(value);
    return new ImageData(data, width, height);
  };

  it('computes diff between frames', () => {
    const base = createImageData(2, 2, 10);
    const changed = createImageData(2, 2, 200);
    const diff = computeFrameDiff(base, changed);
    expect(diff.changeRatio).toBeGreaterThan(0.9);
  });

  it('detects active region and crops canvas', () => {
    const image = createImageData(4, 4, 0);
    const diff = computeFrameDiff(null, image);
    const region = detectActiveRegion(image, diff.bounds);
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 4;
    const cropped = cropToRegion(canvas, region);
    expect(cropped).toBeTruthy();
  });
});
