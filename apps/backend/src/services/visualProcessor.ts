import sharp from 'sharp';
import { logger } from '../logger.js';

type SourceType = 'screen' | 'camera';

export interface ProcessedFrame {
  source: SourceType;
  base64: string;
  width: number;
  height: number;
  capturedAt: number;
}

export interface VisualProcessorOptions {
  frameRate?: number;
  maxResolution?: number;
  compressionQuality?: number;
  historySize?: number;
}

export class VisualProcessor {
  private readonly frameRate: number;
  private readonly maxResolution: number;
  private readonly compressionQuality: number;
  private readonly historySize: number;
  private readonly visualContextBuffer: ProcessedFrame[] = [];

  constructor(options: VisualProcessorOptions = {}) {
    this.frameRate = options.frameRate ?? 1000;
    this.maxResolution = options.maxResolution ?? 1024;
    this.compressionQuality = options.compressionQuality ?? 0.8;
    this.historySize = options.historySize ?? 5;
  }

  get interval(): number {
    return this.frameRate;
  }

  get history(): readonly ProcessedFrame[] {
    return this.visualContextBuffer;
  }

  async captureFrame(buffer: Buffer, source: SourceType): Promise<ProcessedFrame> {
    const image = sharp(buffer, { failOnError: false });
    const metadata = await image.metadata();

    const { width = this.maxResolution, height = this.maxResolution } = metadata;
    const scale = Math.min(this.maxResolution / Math.max(width, height), 1);
    const resizedWidth = Math.floor(width * scale);
    const resizedHeight = Math.floor(height * scale);

    const processed = await image
      .resize(resizedWidth, resizedHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: Math.round(this.compressionQuality * 100) })
      .toBuffer();

    const base64 = processed.toString('base64');
    const frame: ProcessedFrame = {
      source,
      base64,
      width: resizedWidth,
      height: resizedHeight,
      capturedAt: Date.now()
    };

    this.visualContextBuffer.push(frame);
    if (this.visualContextBuffer.length > this.historySize) {
      this.visualContextBuffer.shift();
    }

    return frame;
  }

  summarizeHistory(): string {
    if (!this.visualContextBuffer.length) {
      return 'No visual context available.';
    }

    const latest = this.visualContextBuffer[this.visualContextBuffer.length - 1];
    return `Latest frame captured from ${latest.source} at ${new Date(latest.capturedAt).toISOString()} with resolution ${latest.width}x${latest.height}.`;
  }

  clear(): void {
    logger.debug('Clearing visual context buffer');
    this.visualContextBuffer.length = 0;
  }
}
