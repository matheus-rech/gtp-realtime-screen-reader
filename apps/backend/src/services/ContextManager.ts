import crypto from 'node:crypto';

export type ContextEntry = {
  id: string;
  type: 'audio' | 'visual' | 'gesture' | 'system';
  content: string;
  tokens: number;
  timestamp: number;
};

type ContextManagerOptions = {
  maxTokens: number;
  compressionTrigger: number;
  visualHistorySize: number;
};

const estimateTokens = (content: string): number => Math.ceil(content.length / 4);

export class ContextManager {
  private readonly entries: ContextEntry[] = [];

  constructor(private readonly options: ContextManagerOptions) {}

  updateContext(audioTranscript: string | undefined, visualDescription: string | undefined, timestamp: number): ContextEntry[] {
    if (audioTranscript) {
      this.addEntry('audio', audioTranscript, timestamp);
    }

    if (visualDescription) {
      this.addEntry('visual', visualDescription, timestamp);
      this.trimVisualHistory();
    }

    this.compactIfNecessary();
    return [...this.entries];
  }

  addSystemMessage(content: string): ContextEntry {
    return this.addEntry('system', content, Date.now());
  }

  addGesture(content: string, timestamp: number): ContextEntry {
    return this.addEntry('gesture', content, timestamp);
  }

  private addEntry(type: ContextEntry['type'], content: string, timestamp: number): ContextEntry {
    const entry: ContextEntry = {
      id: crypto.randomUUID(),
      type,
      content,
      tokens: estimateTokens(content),
      timestamp
    };
    this.entries.push(entry);
    return entry;
  }

  private trimVisualHistory(): void {
    const visualEntries = this.entries.filter((entry) => entry.type === 'visual');
    if (visualEntries.length <= this.options.visualHistorySize) {
      return;
    }
    const excess = visualEntries.length - this.options.visualHistorySize;
    const toRemove = visualEntries.slice(0, excess);
    this.entries.splice(0, this.entries.length, ...this.entries.filter((entry) => !toRemove.includes(entry)));
  }

  private compactIfNecessary(): void {
    const totalTokens = this.entries.reduce((acc, entry) => acc + entry.tokens, 0);
    if (totalTokens < this.options.compressionTrigger) {
      return;
    }

    // Apply sliding window compression keeping the most recent context
    let runningTokens = totalTokens;
    for (let i = 0; i < this.entries.length; i += 1) {
      if (runningTokens <= this.options.maxTokens) {
        break;
      }

      const entry = this.entries[i];
      // degrade old entries by summarising
      if (entry.content.length > 64) {
        entry.content = `${entry.content.slice(0, 60)}...`;
        entry.tokens = estimateTokens(entry.content);
      } else {
        entry.content = '[compressed-context]';
        entry.tokens = estimateTokens(entry.content);
      }
      runningTokens = this.entries.reduce((acc, item) => acc + item.tokens, 0);
    }

    // Hard trim oldest entries if still above limit
    while (this.entries.reduce((acc, entry) => acc + entry.tokens, 0) > this.options.maxTokens && this.entries.length > 0) {
      this.entries.shift();
    }
  }
}
