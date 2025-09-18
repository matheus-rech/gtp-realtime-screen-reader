import { visualFrameInterval } from './config';
import type { CaptureMode } from './types';

export interface VisualFrame {
  base64: string;
  capturedAt: number;
  source: 'screen' | 'camera';
}

export interface VisualProcessorOptions {
  fps?: number;
  maxResolution?: number;
  compressionQuality?: number;
  onFrame?: (frame: VisualFrame) => Promise<void> | void;
}

export class VisualProcessor {
  private readonly maxResolution: number;
  private readonly compressionQuality: number;
  private readonly historySize: number;
  private readonly visualContextBuffer: VisualFrame[] = [];
  private readonly videoElements = new Map<'screen' | 'camera', HTMLVideoElement>();
  private readonly streams = new Map<'screen' | 'camera', MediaStream>();
  private readonly streamListeners = new Set<() => void>();
  private canvas?: HTMLCanvasElement;
  private onFrame?: (frame: VisualFrame) => Promise<void> | void;
  private timer: number | null = null;
  private running = false;
  private mode: CaptureMode = 'screen';
  private interval = visualFrameInterval;

  constructor(options: VisualProcessorOptions = {}) {
    this.maxResolution = options.maxResolution ?? 1024;
    this.compressionQuality = options.compressionQuality ?? 0.8;
    this.historySize = 5;
    this.onFrame = options.onFrame;
    if (options.fps && options.fps > 0) {
      this.interval = Math.round(1000 / options.fps);
    }
  }

  get history(): readonly VisualFrame[] {
    return this.visualContextBuffer;
  }

  getStream(source: 'screen' | 'camera'): MediaStream | undefined {
    return this.streams.get(source);
  }

  onStreamChange(listener: () => void) {
    this.streamListeners.add(listener);
    return () => this.streamListeners.delete(listener);
  }

  setFrameInterval(interval: number) {
    this.interval = Math.max(interval, 250);
  }

  private emitStreamChange() {
    for (const listener of this.streamListeners) {
      listener();
    }
  }

  async start(mode: CaptureMode, onFrame: (frame: VisualFrame) => Promise<void> | void) {
    if (typeof document === 'undefined') {
      return;
    }
    this.mode = mode;
    this.onFrame = onFrame;
    await this.prepareStreams(mode);
    this.running = true;
    this.scheduleCapture();
  }

  async switchMode(mode: CaptureMode) {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    await this.prepareStreams(mode);
  }

  stop() {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    for (const stream of this.streams.values()) {
      stream.getTracks().forEach((track) => track.stop());
    }
    this.streams.clear();
  }

  private scheduleCapture() {
    if (!this.running) {
      return;
    }
    const interval = Math.max(this.interval, 500);
    this.timer = window.setTimeout(async () => {
      try {
        await this.capture();
      } finally {
        this.scheduleCapture();
      }
    }, interval);
  }

  private async capture() {
    if (!this.running) {
      return;
    }

    const sources: Array<'screen' | 'camera'> = [];
    if (this.mode === 'screen' || this.mode === 'hybrid') {
      sources.push('screen');
    }
    if (this.mode === 'camera' || this.mode === 'hybrid') {
      sources.push('camera');
    }

    for (const source of sources) {
      const stream = this.streams.get(source);
      if (!stream) {
        continue;
      }
      const frame = await this.captureFromStream(stream, source);
      if (!frame) {
        continue;
      }
      this.visualContextBuffer.push(frame);
      if (this.visualContextBuffer.length > this.historySize) {
        this.visualContextBuffer.shift();
      }
      await this.onFrame?.(frame);
    }
  }

  private async prepareStreams(mode: CaptureMode) {
    if (typeof navigator === 'undefined') {
      return;
    }
    if (mode === 'screen' || mode === 'hybrid') {
      await this.ensureStream('screen', async () => navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }));
    } else {
      this.stopStream('screen');
    }

    if (mode === 'camera' || mode === 'hybrid') {
      await this.ensureStream('camera', async () => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
    } else {
      this.stopStream('camera');
    }
  }

  private async ensureStream(
    source: 'screen' | 'camera',
    factory: () => Promise<MediaStream>
  ) {
    const existing = this.streams.get(source);
    if (existing) {
      return;
    }
    try {
      const stream = await factory();
      this.streams.set(source, stream);
      this.emitStreamChange();
    } catch (error) {
      console.warn(`Failed to acquire ${source} stream`, error);
    }
  }

  private stopStream(source: 'screen' | 'camera') {
    const stream = this.streams.get(source);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      this.streams.delete(source);
      this.emitStreamChange();
    }
  }

  private async captureFromStream(stream: MediaStream, source: 'screen' | 'camera'): Promise<VisualFrame | null> {
    const track = stream.getVideoTracks()[0];
    if (!track) {
      return null;
    }

    let video = this.videoElements.get(source);
    if (!video) {
      video = document.createElement('video');
      video.playsInline = true;
      video.muted = true;
      video.style.position = 'absolute';
      video.style.opacity = '0';
      video.style.pointerEvents = 'none';
      document.body.append(video);
      this.videoElements.set(source, video);
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      await video.play().catch(() => undefined);
    }

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }

    const width = video.videoWidth || this.maxResolution;
    const height = video.videoHeight || this.maxResolution;
    const scale = Math.min(this.maxResolution / Math.max(width, height), 1);
    const targetWidth = Math.max(Math.floor(width * scale), 1);
    const targetHeight = Math.max(Math.floor(height * scale), 1);

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    const context = this.canvas.getContext('2d');
    if (!context) {
      return null;
    }
    context.drawImage(video, 0, 0, targetWidth, targetHeight);
    const dataUrl = this.canvas.toDataURL('image/jpeg', this.compressionQuality);
    const base64 = dataUrl.split(',')[1];

    return {
      base64,
      capturedAt: Date.now(),
      source
    };
  }
}
