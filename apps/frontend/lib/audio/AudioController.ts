'use client';

import { DualQueue } from './DualQueue';

export type AudioChunk = {
  id: string;
  data: ArrayBuffer;
  timestamp: number;
};

type AudioControllerOptions = {
  onChunk: (chunk: AudioChunk) => void;
};

export class AudioController {
  private readonly queue = new DualQueue<AudioChunk>();
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private readonly onChunk: (chunk: AudioChunk) => void;

  constructor(options: AudioControllerOptions) {
    this.onChunk = options.onChunk;
  }

  async start(): Promise<void> {
    if (this.mediaRecorder) {
      return;
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.addEventListener('dataavailable', async (event) => {
      if (event.data.size <= 0) {
        return;
      }
      const buffer = await event.data.arrayBuffer();
      const chunk: AudioChunk = { id: crypto.randomUUID(), data: buffer, timestamp: Date.now() };
      this.queue.enqueue(chunk);
      this.onChunk(chunk);
    });
    this.mediaRecorder.start(200);
  }

  stop(): void {
    this.mediaRecorder?.stop();
    this.mediaRecorder = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.queue.clear();
  }

  onInterruption(): void {
    this.queue.clear();
  }
}
