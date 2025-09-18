import crypto from 'node:crypto';
import type { ProcessedFrame } from './VisualProcessingService.js';

type VisualMemoryEntry = {
  id: string;
  frame: ProcessedFrame;
  description: string;
  embedding: number[];
  storedAt: number;
};

type VisualMemoryOptions = {
  maxEntries: number;
};

export class VisualMemory {
  private readonly entries: VisualMemoryEntry[] = [];

  constructor(private readonly options: VisualMemoryOptions) {}

  async store(frame: ProcessedFrame, description: string, embedding: number[]): Promise<VisualMemoryEntry> {
    if (this.entries.length >= this.options.maxEntries) {
      this.entries.shift();
    }

    const entry: VisualMemoryEntry = {
      id: crypto.randomUUID(),
      frame,
      description,
      embedding,
      storedAt: Date.now()
    };

    this.entries.push(entry);
    return entry;
  }

  async recall(queryEmbedding: number[], topK = 3): Promise<VisualMemoryEntry[]> {
    return this.entries
      .map((entry) => ({ entry, score: this.cosineSimilarity(entry.embedding, queryEmbedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.entry);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((acc, value, index) => acc + value * (b[index] ?? 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((acc, value) => acc + value ** 2, 0));
    const magnitudeB = Math.sqrt(b.reduce((acc, value) => acc + value ** 2, 0));
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    return dot / (magnitudeA * magnitudeB);
  }
}
