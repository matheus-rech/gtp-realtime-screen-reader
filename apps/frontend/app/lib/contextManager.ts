interface ContextEntry {
  audioTranscript: string;
  visualDescription?: string;
  timestamp: number;
}

export class ContextManager {
  private readonly maxTokens: number;
  private readonly visualHistorySize: number;
  private readonly compressionTrigger: number;
  private readonly history: ContextEntry[] = [];

  constructor({
    maxTokens = 128_000,
    visualHistorySize = 10,
    compressionTrigger = 100_000
  } = {}) {
    this.maxTokens = maxTokens;
    this.visualHistorySize = visualHistorySize;
    this.compressionTrigger = compressionTrigger;
  }

  async update(audioTranscript: string, visualDescription: string | undefined, timestamp: number) {
    this.history.push({ audioTranscript, visualDescription, timestamp });
    if (this.history.length > this.visualHistorySize) {
      this.history.shift();
    }
    this.maybeCompress();
  }

  summary(): string {
    return this.history
      .map((entry) => {
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const visual = entry.visualDescription ? ` Visual: ${entry.visualDescription}` : '';
        return `[${time}] Audio: ${entry.audioTranscript}.${visual}`;
      })
      .join('\n');
  }

  latestTranscriptSnippet(): string {
    const last = this.history.at(-1);
    return last?.audioTranscript ?? '';
  }

  private maybeCompress() {
    const totalTokens = this.estimateTokens();
    if (totalTokens < this.compressionTrigger) {
      return;
    }
    if (this.history.length < 2) {
      return;
    }

    const [first, second, ...rest] = this.history;
    this.history.splice(0, this.history.length, {
      audioTranscript: `${first.audioTranscript}\n${second.audioTranscript}`.slice(0, 2000),
      visualDescription: [first.visualDescription, second.visualDescription].filter(Boolean).join('\n'),
      timestamp: second.timestamp
    }, ...rest);
  }

  private estimateTokens(): number {
    return this.history.reduce((total, entry) => {
      const audioTokens = Math.ceil(entry.audioTranscript.length * 0.4);
      const visualTokens = Math.ceil((entry.visualDescription?.length ?? 0) * 0.4);
      return total + audioTokens + visualTokens;
    }, 0);
  }
}
