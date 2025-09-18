'use client';

type FrameRateCallbacks = {
  onTick: () => void;
};

export class FrameRateController {
  private interval: number;
  private timer: number | null = null;
  private readonly callbacks: FrameRateCallbacks;

  constructor(interval: number, callbacks: FrameRateCallbacks) {
    this.interval = interval;
    this.callbacks = callbacks;
  }

  start(): void {
    this.stop();
    this.timer = window.setInterval(() => {
      this.callbacks.onTick();
    }, this.interval);
  }

  stop(): void {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  setInterval(interval: number): void {
    this.interval = interval;
    if (this.timer) {
      this.start();
    }
  }
}
