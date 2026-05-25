import * as crypto from 'crypto';
import { EmbeddingProvider, EmbeddingResult } from './types';

export class MockEmbeddingProvider implements EmbeddingProvider {
  public providerName = 'mock';
  public modelName = 'mock-embedding-3072';
  public defaultDimensions = 3072;

  public async embed(text: string, dimensions?: number): Promise<EmbeddingResult> {
    const start = Date.now();
    const dims = dimensions || this.defaultDimensions;
    
    // Generate deterministic unit vector based on text hash
    const vector = this.generateDeterministicVector(text, dims);
    
    return {
      vector,
      dimensions: dims,
      modelName: this.modelName,
      tokenCount: Math.ceil(text.length / 4),
      latencyMs: Date.now() - start,
    };
  }

  public async embedBatch(texts: string[], dimensions?: number): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map(text => this.embed(text, dimensions)));
  }

  private generateDeterministicVector(text: string, dims: number): number[] {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector: number[] = [];
    
    // Seed a simple LCG pseudo-random number generator with the hash
    let seed = 0;
    for (let i = 0; i < 4; i++) {
      seed = (seed << 8) + hash[i];
    }
    
    // Handle potential zero seed issues
    if (seed === 0) seed = 123456789;

    let sumSq = 0;
    for (let i = 0; i < dims; i++) {
      // Linear Congruential Generator
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      // Value between -1.0 and 1.0
      const val = (seed / 4294967296) * 2 - 1;
      vector.push(val);
      sumSq += val * val;
    }
    
    // Normalize to unit vector
    const norm = Math.sqrt(sumSq);
    return vector.map(v => v / (norm || 1));
  }
}
