'use client';

type Bounds = {
  top: number;
  left: number;
  right: number;
  bottom: number;
};

export type FrameDiff = {
  changeRatio: number;
  bounds: Bounds | null;
};

const DIFF_THRESHOLD = 32;

export const computeFrameDiff = (previous: ImageData | null, current: ImageData): FrameDiff => {
  if (!previous || previous.data.length !== current.data.length) {
    return { changeRatio: 1, bounds: { top: 0, left: 0, right: current.width, bottom: current.height } };
  }

  let changedPixels = 0;
  const bounds: Bounds = { top: current.height, left: current.width, right: 0, bottom: 0 };

  for (let i = 0; i < current.data.length; i += 4) {
    const rDiff = Math.abs(current.data[i] - previous.data[i]);
    const gDiff = Math.abs(current.data[i + 1] - previous.data[i + 1]);
    const bDiff = Math.abs(current.data[i + 2] - previous.data[i + 2]);
    const diff = (rDiff + gDiff + bDiff) / 3;

    if (diff > DIFF_THRESHOLD) {
      changedPixels += 1;
      const pixelIndex = i / 4;
      const x = pixelIndex % current.width;
      const y = Math.floor(pixelIndex / current.width);
      bounds.left = Math.min(bounds.left, x);
      bounds.right = Math.max(bounds.right, x);
      bounds.top = Math.min(bounds.top, y);
      bounds.bottom = Math.max(bounds.bottom, y);
    }
  }

  if (changedPixels === 0) {
    return { changeRatio: 0, bounds: null };
  }

  const totalPixels = current.width * current.height;
  return {
    changeRatio: changedPixels / totalPixels,
    bounds
  };
};

export const detectActiveRegion = (image: ImageData, bounds: Bounds | null): Bounds | null => {
  if (!bounds) {
    return null;
  }

  const padding = 20;
  return {
    top: Math.max(0, bounds.top - padding),
    left: Math.max(0, bounds.left - padding),
    right: Math.min(image.width, bounds.right + padding),
    bottom: Math.min(image.height, bounds.bottom + padding)
  };
};

export const cropToRegion = (canvas: HTMLCanvasElement, bounds: Bounds | null): HTMLCanvasElement | null => {
  if (!bounds) {
    return null;
  }
  const regionCanvas = document.createElement('canvas');
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  regionCanvas.width = Math.max(1, width);
  regionCanvas.height = Math.max(1, height);
  const context = regionCanvas.getContext('2d');
  if (!context) {
    return null;
  }
  context.drawImage(canvas, bounds.left, bounds.top, width, height, 0, 0, width, height);
  return regionCanvas;
};
