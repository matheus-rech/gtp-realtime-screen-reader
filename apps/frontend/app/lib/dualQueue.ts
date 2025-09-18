export class Queue<T> {
  private readonly buffer: T[] = [];
  private resolver: ((value: T) => void) | null = null;
  private paused = false;

  enqueue(item: T) {
    if (this.resolver && !this.paused) {
      this.resolver(item);
      this.resolver = null;
    } else {
      this.buffer.push(item);
    }
  }

  async dequeue(): Promise<T> {
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

    const next = this.buffer.shift();
    if (next) {
      return next;
    }

    return new Promise((resolve) => {
      this.resolver = resolve;
    });
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  clear() {
    this.buffer.length = 0;
  }
}

export class DualQueue<A, V> {
  readonly audioQueue = new Queue<A>();
  readonly visualQueue = new Queue<V>();

  onInterruption() {
    this.audioQueue.clear();
    this.visualQueue.pause();
  }
}
