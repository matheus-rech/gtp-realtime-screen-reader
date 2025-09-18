import sharp from 'sharp';
import { VisualContextCache } from './VisualContextCache.js';
import { ContextManager } from './ContextManager.js';
import { logger } from '../utils/logger.js';
import { env } from '../utils/env.js';

export type FrameSource = 'screen' | 'camera';

export type ProcessedFrame = {
  base64: string;
  width: number;
  height: number;
  capturedAt: number;
  hash: string;
  source: FrameSource;
};

type VisualProcessingOptions = {
  maxResolution: number;
  compressionQuality: number;
  bufferSize: number;
};

export type VisualPipelineHooks = {
  onContextReady: (description: string, frame: ProcessedFrame) => Promise<void>;
};

const DEFAULT_OPTIONS: VisualProcessingOptions = {
  maxResolution: env.visualMaxResolution,
  compressionQuality: 0.8,
  bufferSize: 5
};

export class VisualProcessingService {
  private readonly recentFrames: ProcessedFrame[] = [];

  constructor(
    private readonly contextManager: ContextManager,
    private readonly cache: VisualContextCache,
    private readonly hooks: VisualPipelineHooks
  ) {}

  async processFrame(buffer: Buffer, source: FrameSource): Promise<ProcessedFrame> {
    const { maxResolution, compressionQuality } = DEFAULT_OPTIONS;
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width = maxResolution, height = maxResolution } = metadata;

    const resizeRatio = Math.min(1, maxResolution / Math.max(width, height));
    const resized = image.resize(Math.floor(width * resizeRatio), Math.floor(height * resizeRatio), {
      fit: 'inside'
    });

    const jpeg = await resized.jpeg({ quality: Math.round(compressionQuality * 100) }).toBuffer();
    const base64 = jpeg.toString('base64');

    const processed: ProcessedFrame = {
      base64,
      width: metadata.width ?? maxResolution,
      height: metadata.height ?? maxResolution,
      capturedAt: Date.now(),
      hash: this.cache.hashFrame(jpeg),
      source
    };

    this.pushFrame(processed);
    return processed;
  }

  async describeFrame(frame: ProcessedFrame, quick = false): Promise<string> {
    const cached = this.cache.get(frame.hash);
    if (cached) {
      return cached.description;
    }

    // TODO: Replace this placeholder implementation with actual OpenAI Vision API calls.
    // This is a temporary solution for development/offline mode.
    // Consider adding a configuration flag to control placeholder vs. real API usage.
    const description = quick
      ? `Quick visual snapshot (${frame.source}) at ${new Date(frame.capturedAt).toLocaleTimeString()}`
      : `Detailed visual description for ${frame.source} frame captured at ${new Date(frame.capturedAt).toISOString()}`;

    this.cache.set(frame.hash, description);
    return description;
  }

  async handleFrame(buffer: Buffer, source: FrameSource, opts?: { quick?: boolean }): Promise<void> {
    try {
      const frame = await this.processFrame(buffer, source);
      const description = await this.describeFrame(frame, opts?.quick ?? true);
      this.contextManager.updateContext(undefined, description, frame.capturedAt);
      await this.hooks.onContextReady(description, frame);
    } catch (error) {
      logger.error('Failed to handle frame', { error });
      throw error;
    }
  }

  private pushFrame(frame: ProcessedFrame): void {
    this.recentFrames.push(frame);
    if (this.recentFrames.length > DEFAULT_OPTIONS.bufferSize) {
      this.recentFrames.shift();
    }
  }

  getRecentFrames(): ProcessedFrame[] {
    return [...this.recentFrames];
  }
}
