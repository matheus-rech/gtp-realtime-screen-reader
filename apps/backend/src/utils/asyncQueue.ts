export interface QueueItem<T> {
  data: T;
  timestamp: number;
}

export class AsyncQueue<T> {
  private readonly buffer: QueueItem<T>[] = [];
  private pendingResolver: ((value: QueueItem<T>) => void) | null = null;
  private paused = false;

  enqueue(data: T): void {
    const item: QueueItem<T> = { data, timestamp: Date.now() };
    if (this.pendingResolver && !this.paused) {
      this.pendingResolver(item);
      this.pendingResolver = null;
    } else {
      this.buffer.push(item);
    }
  }

  async dequeue(): Promise<QueueItem<T>> {
    if (this.paused) {
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (!this.paused) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }

    const item = this.buffer.shift();
    if (item) {
      return item;
    }

    return new Promise((resolve) => {
      this.pendingResolver = resolve;
    });
  }

  clear(): void {
    this.buffer.length = 0;
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }
}

export class DualQueue<A, V> {
  readonly audioQueue = new AsyncQueue<A>();
  readonly visualQueue = new AsyncQueue<V>();

  clearOnInterruption(): void {
    this.audioQueue.clear();
    this.visualQueue.pause();
  }
}
