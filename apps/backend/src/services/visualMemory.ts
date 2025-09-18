interface VisualSnapshot {
  frameBase64: string;
  description: string;
  embedding: number[];
  timestamp: number;
}

export class VisualMemory {
  private readonly snapshots: VisualSnapshot[] = [];
  private readonly maxSnapshots: number;

  constructor(maxSnapshots = 50) {
    this.maxSnapshots = maxSnapshots;
  }

  async store(frameBase64: string, description: string, embedding: number[]): Promise<void> {
    this.snapshots.push({ frameBase64, description, embedding, timestamp: Date.now() });
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  async recall(queryEmbedding: number[], topK = 3): Promise<VisualSnapshot[]> {
    if (!this.snapshots.length) {
      return [];
    }

    const scored = this.snapshots.map((snapshot) => ({
      snapshot,
      score: cosineSimilarity(snapshot.embedding, queryEmbedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((entry) => entry.snapshot);
  }
}

const cosineSimilarity = (a: number[], b: number[]): number => {
  const dot = a.reduce((sum, value, index) => {
    // eslint-disable-next-line security/detect-object-injection
    const other = b[index] ?? 0;
    return sum + value * other;
  }, 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dot / (magnitudeA * magnitudeB);
};
