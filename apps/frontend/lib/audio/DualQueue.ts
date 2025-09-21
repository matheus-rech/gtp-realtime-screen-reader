'use client';

export type QueueItem<T> = {
  id: string;
  payload: T;
  timestamp: number;
};

type QueueEvents<T> = {
  onEnqueue?: (item: QueueItem<T>) => void;
  onDequeue?: (item: QueueItem<T>) => void;
  onClear?: () => void;
};

export class DualQueue<T> {
  private readonly audioQueue: QueueItem<T>[] = [];
  private readonly visualQueue: QueueItem<T>[] = [];
  private paused = false;

  constructor(private readonly events: QueueEvents<T> = {}) {}

  enqueue(item: T): void {
    const queueItem: QueueItem<T> = {
      id: crypto.randomUUID(),
      payload: item,
      timestamp: Date.now()
    };
    this.audioQueue.push(queueItem);
    this.events.onEnqueue?.(queueItem);
  }

  enqueueAudio(item: QueueItem<T>): void {
    this.audioQueue.push(item);
    this.events.onEnqueue?.(item);
  }

  enqueueVisual(item: QueueItem<T>): void {
    if (this.paused) {
      return;
    }
    this.visualQueue.push(item);
    this.events.onEnqueue?.(item);
  }

  dequeue(): QueueItem<T> | undefined {
    return this.dequeueAudio();
  }

  dequeueAudio(): QueueItem<T> | undefined {
    const item = this.audioQueue.shift();
    if (item) {
      this.events.onDequeue?.(item);
    }
    return item;
  }

  dequeueVisual(): QueueItem<T> | undefined {
    const item = this.visualQueue.shift();
    if (item) {
      this.events.onDequeue?.(item);
    }
    return item;
  }

  clear(): void {
    this.clearAll();
  }

  clearAudio(): void {
    this.audioQueue.length = 0;
    this.events.onClear?.();
  }

  pauseVisual(): void {
    this.paused = true;
  }

  resumeVisual(): void {
    this.paused = false;
  }

  clearVisual(): void {
    this.visualQueue.length = 0;
    this.events.onClear?.();
  }

  clearAll(): void {
    this.clearAudio();
    this.clearVisual();
  }

  get size(): number {
    return this.audioQueue.length;
  }

  get audioSize(): number {
    return this.audioQueue.length;
  }

  get visualSize(): number {
    return this.visualQueue.length;
  }
}

export class Queue<T> {
  private readonly items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  clear(): void {
    this.items.length = 0;
  }

  get size(): number {
    return this.items.length;
  }
}
