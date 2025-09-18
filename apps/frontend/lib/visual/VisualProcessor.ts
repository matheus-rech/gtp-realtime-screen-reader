'use client';

import { FrameRateController } from './frameRateController';
import { computeFrameDiff, cropToRegion, detectActiveRegion } from './frameUtils';
import type { AssistantMode } from '@/types/realtime';

export type FrameSource = 'screen' | 'camera';

export type VisualFrame = {
  base64: string;
  width: number;
  height: number;
  capturedAt: number;
  source: FrameSource;
};

type VisualProcessorOptions = {
  frameRateMs?: number;
  maxResolution?: number;
  compressionQuality?: number;
  bufferSize?: number;
  onFrame?: (frame: VisualFrame) => void;
};

export class VisualProcessor {
  private readonly frameRateController: FrameRateController;
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private mode: AssistantMode = 'screen';
  private running = false;
  private lastImageData: ImageData | null = null;
  private readonly visualContextBuffer: VisualFrame[] = [];
  private readonly maxResolution: number;
  private readonly compressionQuality: number;
  private readonly bufferSize: number;
  private onFrame?: (frame: VisualFrame) => void;

  constructor(options: VisualProcessorOptions = {}) {
    const frameRateMs = options.frameRateMs ?? 1000;
    this.frameRateController = new FrameRateController(frameRateMs, {
      onTick: () => {
        void this.captureLoop();
      }
    });

    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to create 2d context');
    }
    this.context = context;
    this.maxResolution = options.maxResolution ?? 1024;
    this.compressionQuality = options.compressionQuality ?? 0.8;
    this.bufferSize = options.bufferSize ?? 5;
    this.onFrame = options.onFrame;
  }

  async start(stream: MediaStream, mode: AssistantMode): Promise<void> {
    this.stream = stream;
    this.mode = mode;
    this.video = document.createElement('video');
    this.video.srcObject = stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();
    this.running = true;
    this.frameRateController.start();
  }

  stop(): void {
    this.running = false;
    this.frameRateController.stop();
    this.video?.pause();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.lastImageData = null;
  }

  setMode(mode: AssistantMode): void {
    this.mode = mode;
  }

  setFrameRate(ms: number): void {
    this.frameRateController.setInterval(ms);
  }

  setOnFrame(callback: (frame: VisualFrame) => void): void {
    this.onFrame = callback;
  }

  getFrameBuffer(): VisualFrame[] {
    return [...this.visualContextBuffer];
  }

  private async captureLoop(): Promise<void> {
    if (!this.running || !this.video || this.video.readyState < 2) {
      return;
    }

    const frame = await this.captureFrame(this.mode === 'camera' ? 'camera' : 'screen');
    if (!frame) {
      return;
    }

    this.visualContextBuffer.push(frame);
    if (this.visualContextBuffer.length > this.bufferSize) {
      this.visualContextBuffer.shift();
    }

    this.onFrame?.(frame);
  }

  async captureFrame(source: FrameSource): Promise<VisualFrame | null> {
    if (!this.video) {
      return null;
    }

    const width = Math.min(this.video.videoWidth, this.maxResolution);
    const height = Math.min(this.video.videoHeight, this.maxResolution);
    if (!width || !height) {
      return null;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.context.drawImage(this.video, 0, 0, width, height);

    const imageData = this.context.getImageData(0, 0, width, height);
    const diff = computeFrameDiff(this.lastImageData, imageData);
    this.lastImageData = imageData;

    if (diff.changeRatio < 0.02) {
      return null; // skip if not enough change
    }

    const activeRegion = detectActiveRegion(imageData, diff.bounds);
    if (activeRegion) {
      const cropped = cropToRegion(this.canvas, activeRegion);
      if (cropped) {
        return this.toFrame(cropped, source);
      }
    }

    return this.toFrame(this.canvas, source);
  }

  private async toFrame(canvas: HTMLCanvasElement, source: FrameSource): Promise<VisualFrame> {
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', this.compressionQuality);
    });
    const base64 = await this.blobToBase64(blob);
    const { width, height } = canvas;
    return { base64, width, height, source, capturedAt: Date.now() };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result.split(',')[1] ?? '');
        } else {
          reject(new Error('Unexpected FileReader result'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  }
}
