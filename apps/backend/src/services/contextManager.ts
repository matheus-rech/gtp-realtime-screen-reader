interface ContextEntry {
  audioTranscript: string;
  visualDescription?: string;
  timestamp: number;
}

export interface ContextManagerOptions {
  maxTokens?: number;
  visualHistorySize?: number;
  compressionTrigger?: number;
}

export class ContextManager {
  private readonly maxTokens: number;
  private readonly visualHistorySize: number;
  private readonly compressionTrigger: number;
  private readonly history: ContextEntry[] = [];

  constructor(options: ContextManagerOptions = {}) {
    this.maxTokens = options.maxTokens ?? 128_000;
    this.visualHistorySize = options.visualHistorySize ?? 10;
    this.compressionTrigger = options.compressionTrigger ?? 100_000;
  }

  async updateContext(audioTranscript: string, visualDescription: string | undefined, timestamp: number): Promise<void> {
    this.history.push({ audioTranscript, visualDescription, timestamp });
    if (this.history.length > this.visualHistorySize) {
      this.history.shift();
    }
    this.maybeCompress();
  }

  getSnapshot(): ContextEntry[] {
    return [...this.history];
  }

  private maybeCompress(): void {
    const totalTokens = this.estimateTokens();
    if (totalTokens < this.compressionTrigger) {
      return;
    }

    // Simple compression strategy: merge the oldest two entries.
    if (this.history.length >= 2) {
      const [first, second, ...rest] = this.history;
      const merged: ContextEntry = {
        audioTranscript: `${first.audioTranscript}\n${second.audioTranscript}`.slice(0, 4000),
        visualDescription: [first.visualDescription, second.visualDescription]
          .filter(Boolean)
          .join('\n'),
        timestamp: second.timestamp
      };
      this.history.splice(0, this.history.length, merged, ...rest);
    }
  }

  private estimateTokens(): number {
    return this.history.reduce((total, entry) => {
      const audioTokens = Math.ceil(entry.audioTranscript.length * 0.4);
      const visualTokens = Math.ceil((entry.visualDescription?.length ?? 0) * 0.4);
      return total + audioTokens + visualTokens;
    }, 0);
  }
}
